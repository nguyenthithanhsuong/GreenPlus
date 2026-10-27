-- GreenPlus v2 / 0013 - Transactional multi-store checkout with idempotency.
-- Based on the checked-in GreenPlus baseline (0001-0012) and the checkout
-- function contract used by web-client/backend/modules/orders/order.repository.ts.
-- IMPORTANT: apply to a staging/local database and verify before production.
BEGIN;

CREATE TABLE IF NOT EXISTS public.checkout_requests (
    user_id uuid NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
    store_id uuid NOT NULL REFERENCES public.stores(store_id) ON DELETE RESTRICT,
    idempotency_key text NOT NULL
      CHECK (idempotency_key ~ '^[A-Za-z0-9._:-]{8,128}$'),
    request_hash text NOT NULL,
    order_id uuid REFERENCES public.orders(order_id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, store_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_checkout_requests_order_id
    ON public.checkout_requests(order_id)
    WHERE order_id IS NOT NULL;

ALTER TABLE public.checkout_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.checkout_requests FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.checkout_cart(
    p_user_id uuid,
    p_store_id uuid,
    p_idempotency_key text,
    p_delivery_address text,
    p_delivery_fee numeric,
    p_note text,
    p_payment_method text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_cart_id uuid;
    v_order_id uuid;
    v_existing_total numeric;
    v_existing_hash text;
    v_request_hash text;
    v_total numeric;
    v_item record;
    v_stock record;
    v_remaining integer;
    v_take integer;
    v_changed integer;
BEGIN
    IF p_user_id IS NULL OR p_store_id IS NULL THEN
        RAISE EXCEPTION 'userId and storeId are required' USING ERRCODE = '22023';
    END IF;
    IF p_idempotency_key IS NULL OR
       p_idempotency_key !~ '^[A-Za-z0-9._:-]{8,128}$' THEN
        RAISE EXCEPTION 'idempotencyKey must be 8-128 safe characters'
            USING ERRCODE = '22023';
    END IF;
    IF p_delivery_address IS NULL OR length(btrim(p_delivery_address)) < 5 OR
       length(btrim(p_delivery_address)) > 255 THEN
        RAISE EXCEPTION 'delivery address must be 5-255 characters'
            USING ERRCODE = '22023';
    END IF;
    IF p_delivery_fee IS NULL OR p_delivery_fee < 0 THEN
        RAISE EXCEPTION 'delivery fee must be non-negative'
            USING ERRCODE = '22023';
    END IF;
    IF p_payment_method IS NULL OR
       p_payment_method NOT IN ('cod', 'momo', 'vnpay', 'bank_transfer') THEN
        RAISE EXCEPTION 'invalid payment method' USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.user_id = p_user_id AND u.status = 'active'
    ) THEN
        RAISE EXCEPTION 'customer account is not active'
            USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.stores s
        WHERE s.store_id = p_store_id AND s.status = 'active'
    ) THEN
        RAISE EXCEPTION 'store is not active' USING ERRCODE = '22023';
    END IF;

    -- Bind an idempotency key to the checkout parameters. Do not bind to the
    -- mutable cart: a successful checkout intentionally empties that cart.
    v_request_hash := md5(pg_catalog.jsonb_build_object(
        'address', btrim(p_delivery_address),
        'fee', p_delivery_fee,
        'note', NULLIF(btrim(coalesce(p_note, '')), ''),
        'method', p_payment_method
    )::text);

    -- Serialize requests for the same user's cart/store, including retries.
    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(p_user_id::text || ':' || p_store_id::text, 0)
    );

    INSERT INTO public.checkout_requests (
        user_id, store_id, idempotency_key, request_hash
    ) VALUES (
        p_user_id, p_store_id, p_idempotency_key, v_request_hash
    )
    ON CONFLICT (user_id, store_id, idempotency_key) DO NOTHING;

    SELECT cr.order_id, cr.request_hash, o.total_amount
      INTO v_order_id, v_existing_hash, v_existing_total
      FROM public.checkout_requests cr
      LEFT JOIN public.orders o ON o.order_id = cr.order_id
     WHERE cr.user_id = p_user_id
       AND cr.store_id = p_store_id
       AND cr.idempotency_key = p_idempotency_key
     FOR UPDATE OF cr;

    IF v_existing_hash IS DISTINCT FROM v_request_hash THEN
        RAISE EXCEPTION 'idempotency key reused with different checkout details'
            USING ERRCODE = '22023';
    END IF;

    IF v_order_id IS NOT NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'order_id', v_order_id,
            'status', 'pending',
            'total_amount', v_existing_total
        );
    END IF;

    -- An order must belong to the same user and store as its cart/items.
    SELECT c.cart_id INTO v_cart_id
      FROM public.carts c
     WHERE c.user_id = p_user_id AND c.store_id = p_store_id
       AND EXISTS (
           SELECT 1 FROM public.cart_items ci
            WHERE ci.cart_id = c.cart_id AND ci.store_id = p_store_id
       )
     ORDER BY c.updated_at DESC NULLS LAST, c.created_at DESC, c.cart_id
     LIMIT 1
     FOR UPDATE OF c;

    IF v_cart_id IS NULL THEN
        RAISE EXCEPTION 'cart is empty or not found for this store'
            USING ERRCODE = '22023';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.cart_items ci
         WHERE ci.cart_id = v_cart_id
           AND ci.store_id IS DISTINCT FROM p_store_id
    ) THEN
        RAISE EXCEPTION 'cart contains items from another store'
            USING ERRCODE = '22023';
    END IF;

    -- Order creation, inventory reservation, payment, idempotency record and
    -- cart clearing all run in ONE PostgreSQL RPC transaction. Any exception
    -- rolls back everything; there is no partial checkout.
    v_total := p_delivery_fee;
    INSERT INTO public.orders (
        user_id, store_id, total_amount, delivery_address,
        delivery_fee, note, status
    ) VALUES (
        p_user_id, p_store_id, v_total, btrim(p_delivery_address),
        p_delivery_fee, NULLIF(btrim(coalesce(p_note, '')), ''), 'pending'
    ) RETURNING order_id INTO v_order_id;

    FOR v_item IN
        SELECT ci.product_id, ci.quantity, ci.note
          FROM public.cart_items ci
         WHERE ci.cart_id = v_cart_id AND ci.store_id = p_store_id
         ORDER BY ci.product_id, ci.cart_item_id
    LOOP
        IF v_item.quantity IS NULL OR v_item.quantity <= 0 THEN
            RAISE EXCEPTION 'invalid quantity for product %', v_item.product_id
                USING ERRCODE = '22023';
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM public.products p
             WHERE p.product_id = v_item.product_id
               AND p.store_id = p_store_id AND p.status = 'active'
        ) THEN
            RAISE EXCEPTION 'product unavailable in selected store: %', v_item.product_id
                USING ERRCODE = '22023';
        END IF;

        v_remaining := v_item.quantity;
        WHILE v_remaining > 0 LOOP
            -- FEFO: choose an unexpired batch, using its latest active price.
            -- The inventory row is locked before subtraction to avoid oversell.
            SELECT i.inventory_id, b.batch_id, i.quantity_available, pr.price
              INTO v_stock
              FROM public.batches b
              JOIN public.inventory i
                ON i.batch_id = b.batch_id AND i.store_id = p_store_id
              JOIN LATERAL (
                  SELECT price.price
                    FROM public.prices price
                   WHERE price.batch_id = b.batch_id
                     AND price.store_id = p_store_id
                     AND coalesce(price.status, 'active') = 'active'
                   ORDER BY price.date DESC, price.price_id DESC
                   LIMIT 1
              ) pr ON TRUE
             WHERE b.product_id = v_item.product_id
               AND b.store_id = p_store_id
               AND b.status = 'available'
               AND b.expire_date >= CURRENT_DATE
               AND i.quantity_available > 0
             ORDER BY b.expire_date ASC, b.batch_id, i.inventory_id
             LIMIT 1
             FOR UPDATE OF i;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'insufficient sellable stock or missing active price for product %',
                    v_item.product_id USING ERRCODE = 'P0001';
            END IF;
            IF v_stock.price IS NULL OR v_stock.price <= 0 THEN
                RAISE EXCEPTION 'invalid price for product %', v_item.product_id
                    USING ERRCODE = '22023';
            END IF;

            v_take := LEAST(v_remaining, v_stock.quantity_available);
            UPDATE public.inventory
               SET quantity_available = quantity_available - v_take,
                   quantity_reserved = coalesce(quantity_reserved, 0) + v_take,
                   last_updated = now()
             WHERE inventory_id = v_stock.inventory_id
               AND store_id = p_store_id
               AND quantity_available >= v_take;
            GET DIAGNOSTICS v_changed = ROW_COUNT;
            IF v_changed <> 1 THEN
                RAISE EXCEPTION 'concurrent stock change; retry checkout'
                    USING ERRCODE = '40001';
            END IF;

            INSERT INTO public.order_items (
                order_id, store_id, product_id, batch_id, quantity, price, note
            ) VALUES (
                v_order_id, p_store_id, v_item.product_id,
                v_stock.batch_id, v_take, v_stock.price, v_item.note
            );
            v_total := v_total + (v_take * v_stock.price);
            v_remaining := v_remaining - v_take;
        END LOOP;
    END LOOP;

    UPDATE public.orders
       SET total_amount = v_total
     WHERE order_id = v_order_id AND store_id = p_store_id;

    INSERT INTO public.payments (
        order_id, store_id, method, status, amount
    ) VALUES (
        v_order_id, p_store_id, p_payment_method, 'pending', v_total
    );

    UPDATE public.checkout_requests
       SET order_id = v_order_id
     WHERE user_id = p_user_id
       AND store_id = p_store_id
       AND idempotency_key = p_idempotency_key;

    DELETE FROM public.cart_items
     WHERE cart_id = v_cart_id AND store_id = p_store_id;

    RETURN pg_catalog.jsonb_build_object(
        'order_id', v_order_id,
        'status', 'pending',
        'total_amount', v_total
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.checkout_cart(uuid,uuid,text,text,numeric,text,text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.checkout_cart(uuid,uuid,text,text,numeric,text,text)
    TO service_role;
COMMIT;

NOTIFY pgrst, 'reload schema';
