-- Local Docker lab only, never apply to Supabase production.
-- Atomic payment simulation, delivery assignment and completion.
BEGIN;
ALTER TABLE public.commerce_orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';
DO $c$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.commerce_orders'::regclass AND conname='commerce_payment_status_004') THEN
  ALTER TABLE public.commerce_orders ADD CONSTRAINT commerce_payment_status_004 CHECK (payment_status IN ('unpaid','paid'));
 END IF;
END $c$;
CREATE TABLE IF NOT EXISTS public.commerce_deliveries (
 store_id uuid NOT NULL, order_id uuid NOT NULL, assigned_to text NOT NULL CHECK (length(assigned_to) BETWEEN 1 AND 120),
 status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','delivered')),
 assigned_at timestamptz NOT NULL DEFAULT now(), delivered_at timestamptz,
 PRIMARY KEY(store_id,order_id),
 FOREIGN KEY(store_id,order_id) REFERENCES public.commerce_orders(store_id,order_id),
 CHECK ((status='delivered') = (delivered_at IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS public.commerce_events (
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, store_id uuid NOT NULL, order_id uuid NOT NULL,
 action text NOT NULL CHECK(action IN ('payment_simulated','delivery_assigned','delivered','cancelled')),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(store_id,order_id) REFERENCES public.commerce_orders(store_id,order_id)
);
CREATE INDEX IF NOT EXISTS commerce_events_store_004 ON public.commerce_events(store_id,order_id,created_at DESC);
REVOKE ALL ON public.commerce_deliveries, public.commerce_events FROM PUBLIC, web_anon;
GRANT SELECT ON public.commerce_deliveries, public.commerce_events TO web_anon;

-- This is SIMULATED payment, never a payment provider webhook.
CREATE OR REPLACE FUNCTION public.demo_confirm_payment(p_store uuid, p_order uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $fn$
DECLARE prior public.commerce_orders%ROWTYPE;
BEGIN
 IF p_store IS NULL OR p_order IS NULL THEN RAISE EXCEPTION 'Invalid payment request'; END IF;
 SELECT * INTO prior FROM public.commerce_orders WHERE store_id=p_store AND order_id=p_order FOR UPDATE;
 IF NOT FOUND OR prior.status<>'pending' THEN RAISE EXCEPTION 'Pending order not found'; END IF;
 IF prior.payment_status='paid' THEN
  RETURN jsonb_build_object('order_id',p_order,'payment_status','paid','replayed',true);
 END IF;
 UPDATE public.commerce_orders SET payment_status='paid' WHERE store_id=p_store AND order_id=p_order;
 INSERT INTO public.commerce_events(store_id,order_id,action) VALUES(p_store,p_order,'payment_simulated');
 RETURN jsonb_build_object('order_id',p_order,'payment_status','paid','replayed',false);
END $fn$;

CREATE OR REPLACE FUNCTION public.demo_assign_delivery(p_store uuid, p_order uuid, p_assignee text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $fn$
DECLARE prior public.commerce_orders%ROWTYPE; existing public.commerce_deliveries%ROWTYPE;
BEGIN
 IF p_store IS NULL OR p_order IS NULL OR p_assignee IS NULL OR
    length(trim(p_assignee)) NOT BETWEEN 1 AND 120 THEN RAISE EXCEPTION 'Invalid delivery request'; END IF;
 SELECT * INTO prior FROM public.commerce_orders WHERE store_id=p_store AND order_id=p_order FOR UPDATE;
 IF NOT FOUND OR prior.status<>'pending' OR prior.payment_status<>'paid' THEN
  RAISE EXCEPTION 'Paid pending order not found'; END IF;
 SELECT * INTO existing FROM public.commerce_deliveries WHERE store_id=p_store AND order_id=p_order;
 IF FOUND THEN
  IF existing.assigned_to <> trim(p_assignee) THEN RAISE EXCEPTION 'Order already assigned'; END IF;
  RETURN jsonb_build_object('order_id',p_order,'delivery_status',existing.status,'replayed',true);
 END IF;
 INSERT INTO public.commerce_deliveries(store_id,order_id,assigned_to) VALUES(p_store,p_order,trim(p_assignee));
 INSERT INTO public.commerce_events(store_id,order_id,action) VALUES(p_store,p_order,'delivery_assigned');
 RETURN jsonb_build_object('order_id',p_order,'delivery_status','assigned','replayed',false);
END $fn$;

CREATE OR REPLACE FUNCTION public.demo_complete_delivery(p_store uuid, p_order uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $fn$
DECLARE prior public.commerce_orders%ROWTYPE; delivery public.commerce_deliveries%ROWTYPE;
BEGIN
 IF p_store IS NULL OR p_order IS NULL THEN RAISE EXCEPTION 'Invalid delivery request'; END IF;
 SELECT * INTO prior FROM public.commerce_orders WHERE store_id=p_store AND order_id=p_order FOR UPDATE;
 IF NOT FOUND OR prior.status <> 'pending' OR prior.payment_status <> 'paid' THEN
  RAISE EXCEPTION 'Paid pending order not found'; END IF;
 SELECT * INTO delivery FROM public.commerce_deliveries WHERE store_id=p_store AND order_id=p_order FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Delivery not assigned'; END IF;
 IF delivery.status='delivered' THEN
  RETURN jsonb_build_object('order_id',p_order,'delivery_status','delivered','replayed',true);
 END IF;
 UPDATE public.commerce_deliveries SET status='delivered',delivered_at=now() WHERE store_id=p_store AND order_id=p_order;
 INSERT INTO public.commerce_events(store_id,order_id,action) VALUES(p_store,p_order,'delivered');
 RETURN jsonb_build_object('order_id',p_order,'delivery_status','delivered','replayed',false);
END $fn$;

-- Override 003: paid or shipped orders MUST NOT be cancelled by a stock-only refund.
CREATE OR REPLACE FUNCTION public.demo_cancel_order(p_store uuid,p_order uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $fn$
DECLARE prior public.commerce_orders%ROWTYPE; row_item record;
BEGIN
 IF p_store IS NULL OR p_order IS NULL THEN RAISE EXCEPTION 'Invalid cancellation'; END IF;
 SELECT * INTO prior FROM public.commerce_orders WHERE store_id=p_store AND order_id=p_order FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
 IF prior.status='cancelled' THEN
  RETURN jsonb_build_object('order_id',p_order,'status','cancelled','replayed',true);
 END IF;
 IF prior.payment_status <> 'unpaid' OR EXISTS
   (SELECT 1 FROM public.commerce_deliveries WHERE store_id=p_store AND order_id=p_order) THEN
  RAISE EXCEPTION 'Paid or shipped order cannot use demo cancellation';
 END IF;
 UPDATE public.commerce_orders SET status='cancelled' WHERE store_id=p_store AND order_id=p_order;
 FOR row_item IN SELECT product_id,quantity FROM public.commerce_order_items WHERE store_id=p_store AND order_id=p_order LOOP
  UPDATE public.inventory_stock SET available=available+row_item.quantity,updated_at=now()
   WHERE store_id=p_store AND product_id=row_item.product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inventory row missing on cancellation'; END IF;
 END LOOP;
 INSERT INTO public.commerce_events(store_id,order_id,action) VALUES(p_store,p_order,'cancelled');
 RETURN jsonb_build_object('order_id',p_order,'status','cancelled','replayed',false);
END $fn$;
REVOKE ALL ON FUNCTION public.demo_confirm_payment(uuid,uuid), public.demo_assign_delivery(uuid,uuid,text), public.demo_complete_delivery(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.demo_confirm_payment(uuid,uuid), public.demo_assign_delivery(uuid,uuid,text), public.demo_complete_delivery(uuid,uuid) TO web_anon;
COMMIT;

