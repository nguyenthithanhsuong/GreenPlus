-- GreenPlus Docker lab ONLY; apply via docker:three-tier:up, never on Supabase.
-- Docker demo only. Idempotent schema upgrade. Not a Supabase migration.
BEGIN;
CREATE TABLE IF NOT EXISTS public.inventory_stock (
 store_id uuid NOT NULL, product_id uuid NOT NULL, available integer NOT NULL DEFAULT 0 CHECK (available>=0),
 updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (store_id,product_id)
);
CREATE TABLE IF NOT EXISTS public.commerce_orders (
 order_id uuid PRIMARY KEY, store_id uuid NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','cancelled')),
 total numeric(14,2) NOT NULL CHECK (total>=0), created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(store_id,order_id)
);
CREATE TABLE IF NOT EXISTS public.commerce_order_items (
 store_id uuid NOT NULL, order_id uuid NOT NULL, product_id uuid NOT NULL,
 quantity integer NOT NULL CHECK(quantity>0), unit_price numeric(12,2) NOT NULL CHECK(unit_price>=0),
 PRIMARY KEY(order_id,product_id),
 FOREIGN KEY(store_id,order_id) REFERENCES public.commerce_orders(store_id,order_id)
);
CREATE INDEX IF NOT EXISTS public_stock_store_idx ON public.inventory_stock(store_id);
CREATE INDEX IF NOT EXISTS public_orders_store_idx ON public.commerce_orders(store_id,created_at DESC);
-- Only gateway RPC may change stock or order state. PostgREST uses database superuser in this lab;
-- grants below are defense-in-depth, NOT adequate for direct public PostgREST exposure.
REVOKE ALL ON public.inventory_stock,public.commerce_orders,public.commerce_order_items FROM PUBLIC, web_anon;
GRANT SELECT ON public.inventory_stock,public.commerce_orders,public.commerce_order_items TO web_anon;
CREATE OR REPLACE FUNCTION public.demo_restock(p_store uuid,p_product uuid,p_quantity integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $fn$
DECLARE result integer;
BEGIN
 IF p_store IS NULL OR p_product IS NULL OR p_quantity IS NULL OR p_quantity<=0 OR p_quantity>100000 THEN
  RAISE EXCEPTION 'Invalid restock inputs'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.products WHERE store_id=p_store AND product_id=p_product) THEN
  RAISE EXCEPTION 'Product not found for store'; END IF;
 INSERT INTO public.inventory_stock(store_id,product_id,available) VALUES(p_store,p_product,p_quantity)
 ON CONFLICT(store_id,product_id) DO UPDATE SET available=public.inventory_stock.available+EXCLUDED.available,updated_at=now()
 RETURNING available INTO result;
 RETURN jsonb_build_object('product_id',p_product,'available',result);
END $fn$;
CREATE OR REPLACE FUNCTION public.demo_checkout(p_store uuid,p_order uuid,p_items jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $fn$
DECLARE line record; total_amount numeric(14,2):=0; prior public.commerce_orders%ROWTYPE; item_count integer;
BEGIN
 IF p_store IS NULL OR p_order IS NULL OR jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items)=0 OR jsonb_array_length(p_items)>50 THEN
  RAISE EXCEPTION 'Invalid checkout input'; END IF;
 -- Reject malformed items rather than letting PostgreSQL silently coerce them.
 IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_items) AS x(item)
   WHERE jsonb_typeof(x.item) <> 'object' OR (x.item->>'product_id') IS NULL
      OR (x.item->>'quantity') !~ '^[1-9][0-9]{0,5}$' OR (x.item->>'quantity')::integer > 1000) THEN
  RAISE EXCEPTION 'Invalid checkout item'; END IF;
 -- Serialize retries of the same order ID without a cross-request gateway lock.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_order::text,0));
 SELECT * INTO prior FROM public.commerce_orders WHERE order_id=p_order;
 IF FOUND THEN
  IF prior.store_id<>p_store THEN RAISE EXCEPTION 'Order belongs to another store'; END IF;
  -- A reused idempotency key MUST match the original normalized lines.
  IF EXISTS (
    (SELECT product_id, quantity FROM public.commerce_order_items WHERE store_id=p_store AND order_id=p_order)
    EXCEPT
    (SELECT (x.item->>'product_id')::uuid, sum((x.item->>'quantity')::integer)::integer FROM jsonb_array_elements(p_items) x(item) GROUP BY 1)
  ) OR EXISTS (
    (SELECT (x.item->>'product_id')::uuid, sum((x.item->>'quantity')::integer)::integer FROM jsonb_array_elements(p_items) x(item) GROUP BY 1)
    EXCEPT
    (SELECT product_id, quantity FROM public.commerce_order_items WHERE store_id=p_store AND order_id=p_order)
  ) THEN RAISE EXCEPTION 'Order idempotency payload mismatch'; END IF;
  RETURN jsonb_build_object('order_id',p_order,'status',prior.status,'total',prior.total,'replayed',true);
 END IF;
 -- Validate UUIDs by casting within the transaction; duplicate entries are aggregated.
 SELECT count(*) INTO item_count FROM (SELECT (x.item->>'product_id')::uuid AS product_id FROM jsonb_array_elements(p_items) x(item) GROUP BY 1) a;
 IF item_count=0 THEN RAISE EXCEPTION 'Empty order'; END IF;
 INSERT INTO public.commerce_orders(order_id,store_id,total) VALUES(p_order,p_store,0);
 FOR line IN
  SELECT (x.item->>'product_id')::uuid product_id, sum((x.item->>'quantity')::integer)::integer quantity
  FROM jsonb_array_elements(p_items) x(item) GROUP BY 1 ORDER BY 1
 LOOP
  -- Atomic guarded decrement prevents negative stock under concurrent checkout requests.
  UPDATE public.inventory_stock i SET available=i.available-line.quantity,updated_at=now()
    WHERE i.store_id=p_store AND i.product_id=line.product_id AND i.available>=line.quantity;
  IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient inventory or unknown product'; END IF;
  INSERT INTO public.commerce_order_items(store_id,order_id,product_id,quantity,unit_price)
    SELECT p_store,p_order,p.product_id,line.quantity,p.price
    FROM public.products p WHERE p.store_id=p_store AND p.product_id=line.product_id AND p.status='active';
  IF NOT FOUND THEN RAISE EXCEPTION 'Product inactive or unknown'; END IF;
 END LOOP;
 SELECT COALESCE(sum(quantity*unit_price),0) INTO total_amount FROM public.commerce_order_items WHERE order_id=p_order;
 UPDATE public.commerce_orders SET total=total_amount WHERE order_id=p_order;
 RETURN jsonb_build_object('order_id',p_order,'status','pending','total',total_amount,'replayed',false);
END $fn$;
CREATE OR REPLACE FUNCTION public.demo_cancel_order(p_store uuid,p_order uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $fn$
DECLARE updated_id uuid; row_item record;
BEGIN
 IF p_store IS NULL OR p_order IS NULL THEN RAISE EXCEPTION 'Invalid cancellation'; END IF;
 UPDATE public.commerce_orders SET status='cancelled'
 WHERE store_id=p_store AND order_id=p_order AND status='pending' RETURNING order_id INTO updated_id;
 IF updated_id IS NULL THEN
  IF EXISTS (SELECT 1 FROM public.commerce_orders WHERE store_id=p_store AND order_id=p_order AND status='cancelled') THEN
   RETURN jsonb_build_object('order_id',p_order,'status','cancelled','replayed',true);
  END IF;
  RAISE EXCEPTION 'Pending order not found';
 END IF;
 FOR row_item IN SELECT product_id,quantity FROM public.commerce_order_items WHERE store_id=p_store AND order_id=p_order LOOP
  UPDATE public.inventory_stock SET available=available+row_item.quantity,updated_at=now()
   WHERE store_id=p_store AND product_id=row_item.product_id;
 END LOOP;
 RETURN jsonb_build_object('order_id',p_order,'status','cancelled','replayed',false);
END $fn$;
REVOKE ALL ON FUNCTION public.demo_restock(uuid,uuid,integer),public.demo_checkout(uuid,uuid,jsonb),public.demo_cancel_order(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.demo_restock(uuid,uuid,integer),public.demo_checkout(uuid,uuid,jsonb),public.demo_cancel_order(uuid,uuid) TO web_anon;
COMMIT;

