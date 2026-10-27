-- TEMPLATE ONLY: keep outside supabase/migrations until application rollout,
-- staging validation, zero NULL scoped rows, and cross-store checks pass.
BEGIN;

CREATE TABLE IF NOT EXISTS public.checkout_requests (
  user_id uuid NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
  store_id uuid NOT NULL REFERENCES public.stores(store_id) ON DELETE RESTRICT,
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 8 AND 128),
  order_id uuid REFERENCES public.orders(order_id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, store_id, idempotency_key)
);

CREATE OR REPLACE FUNCTION public.checkout_cart(
  p_user_id uuid,
  p_store_id uuid,
  p_idempotency_key text,
  p_delivery_address text,
  p_delivery_fee numeric,
  p_note text,
  p_payment_method text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart_id uuid;
  v_order_id uuid;
  v_total numeric := 0;
  v_item record;
  v_price numeric;
  v_available integer;
  v_batch_id uuid;
  v_existing_total numeric;
BEGIN
  IF p_idempotency_key IS NULL OR p_idempotency_key !~ '^[A-Za-z0-9._:-]{8,128}$' THEN
    RAISE EXCEPTION 'invalid idempotency key' USING ERRCODE = '22023';
  END IF;
  IF p_delivery_address IS NULL OR btrim(p_delivery_address) = '' THEN
    RAISE EXCEPTION 'delivery address is required' USING ERRCODE = '22023';
  END IF;
  IF p_delivery_fee IS NULL OR p_delivery_fee < 0 THEN
    RAISE EXCEPTION 'delivery fee must be non-negative' USING ERRCODE = '22023';
  END IF;
  IF p_payment_method NOT IN ('cod','momo','vnpay','bank_transfer') THEN
    RAISE EXCEPTION 'invalid payment method' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_store_id::text, 0));

  INSERT INTO public.checkout_requests(user_id, store_id, idempotency_key)
  VALUES (p_user_id, p_store_id, p_idempotency_key)
  ON CONFLICT (user_id, store_id, idempotency_key) DO NOTHING;

  SELECT cr.order_id, o.total_amount
    INTO v_order_id, v_existing_total
  FROM public.checkout_requests cr
  LEFT JOIN public.orders o ON o.order_id = cr.order_id
  WHERE cr.user_id = p_user_id
    AND cr.store_id = p_store_id
    AND cr.idempotency_key = p_idempotency_key
  FOR UPDATE OF cr;

  IF v_order_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'order_id', v_order_id,
      'status', 'pending',
      'total_amount', v_existing_total
    );
  END IF;

  SELECT cart_id INTO v_cart_id
  FROM public.carts
  WHERE user_id = p_user_id AND store_id = p_store_id
    AND EXISTS (
      SELECT 1
      FROM public.cart_items ci
      WHERE ci.cart_id = public.carts.cart_id
        AND ci.store_id = p_store_id
    )
  ORDER BY updated_at DESC NULLS LAST, created_at DESC, cart_id
  FOR UPDATE;

  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'cart not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.cart_items WHERE cart_id = v_cart_id AND store_id = p_store_id) THEN
    RAISE EXCEPTION 'cart is empty' USING ERRCODE = '22023';
  END IF;

  FOR v_item IN
    SELECT ci.product_id, ci.quantity, ci.note
    FROM public.cart_items ci
    JOIN public.products p ON p.product_id = ci.product_id AND p.store_id = p_store_id AND p.status = 'active'
    WHERE ci.cart_id = v_cart_id AND ci.store_id = p_store_id
  LOOP
    SELECT pr.price INTO v_price
    FROM public.prices pr
    JOIN public.batches b ON b.batch_id = pr.batch_id
    WHERE b.product_id = v_item.product_id
      AND b.store_id = p_store_id
      AND pr.store_id = p_store_id
      AND b.status = 'available'
      AND b.expire_date >= CURRENT_DATE
    ORDER BY pr.date DESC
    LIMIT 1;

    IF v_price IS NULL THEN
      RAISE EXCEPTION 'missing price for product %', v_item.product_id USING ERRCODE = '22023';
    END IF;

    v_total := v_total + (v_price * v_item.quantity);
  END LOOP;

  v_total := v_total + p_delivery_fee;
  INSERT INTO public.orders(user_id, store_id, total_amount, delivery_address, delivery_fee, note, status)
  VALUES (p_user_id, p_store_id, v_total, btrim(p_delivery_address), p_delivery_fee, NULLIF(btrim(coalesce(p_note,'')),''), 'pending')
  RETURNING order_id INTO v_order_id;

  UPDATE public.checkout_requests
  SET order_id = v_order_id
  WHERE user_id = p_user_id
    AND store_id = p_store_id
    AND idempotency_key = p_idempotency_key;

  FOR v_item IN
    SELECT ci.product_id, ci.quantity, ci.note
    FROM public.cart_items ci
    WHERE ci.cart_id = v_cart_id AND ci.store_id = p_store_id
  LOOP
    SELECT b.batch_id, pr.price, i.quantity_available
      INTO v_batch_id, v_price, v_available
    FROM public.batches b
    JOIN public.prices pr ON pr.batch_id = b.batch_id AND pr.store_id = p_store_id
    JOIN public.inventory i ON i.batch_id = b.batch_id AND i.store_id = p_store_id
    WHERE b.product_id = v_item.product_id
      AND b.store_id = p_store_id
      AND b.status = 'available'
      AND b.expire_date >= CURRENT_DATE
      AND i.quantity_available >= v_item.quantity
    ORDER BY b.expire_date ASC, pr.date DESC
    LIMIT 1
    FOR UPDATE OF i;

    IF v_batch_id IS NULL THEN
      RAISE EXCEPTION 'insufficient stock for product %', v_item.product_id USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.inventory
    SET quantity_available = quantity_available - v_item.quantity,
        quantity_reserved = quantity_reserved + v_item.quantity
    WHERE batch_id = v_batch_id AND store_id = p_store_id;

    INSERT INTO public.order_items(order_id, store_id, product_id, batch_id, quantity, price, note)
    VALUES (v_order_id, p_store_id, v_item.product_id, v_batch_id, v_item.quantity, v_price, v_item.note);
  END LOOP;

  INSERT INTO public.payments(order_id, store_id, method, status, amount)
  VALUES (v_order_id, p_store_id, p_payment_method, 'pending', v_total);

  DELETE FROM public.cart_items WHERE cart_id = v_cart_id AND store_id = p_store_id;
  RETURN jsonb_build_object('order_id', v_order_id, 'status', 'pending', 'total_amount', v_total);
END;
$$;

REVOKE ALL ON TABLE public.checkout_requests FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.checkout_cart(uuid,uuid,text,text,numeric,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.checkout_cart(uuid,uuid,text,text,numeric,text,text) TO service_role;
COMMIT;
