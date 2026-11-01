-- GreenPlus v2 / 0014: synchronize an order when an assigned shipper completes delivery.
-- Requires tenant columns introduced in 0005 and status constraints from 0001.
-- Apply AFTER 0013 (if 0013 is deployed). No client-side service_role keys are exposed.
-- An AFTER trigger makes delivery + order changes part of ONE PostgreSQL transaction:
-- if order cannot be completed, the delivery update is rolled back.
BEGIN;

CREATE OR REPLACE FUNCTION public.fn_complete_order_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_order_status text;
BEGIN
    IF NEW.order_id IS NULL OR NEW.store_id IS NULL THEN
        RAISE EXCEPTION 'Delivery must reference an order and a store'
          USING ERRCODE = '23514';
    END IF;

    -- Lock the parent order and verify the SAME store, not only the order ID.
    SELECT o.status::text
      INTO v_order_status
      FROM public.orders AS o
     WHERE o.order_id = NEW.order_id
       AND o.store_id = NEW.store_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cannot complete delivery: parent order/store not found'
          USING ERRCODE = '23503';
    END IF;

    IF v_order_status = 'completed' THEN
        -- Idempotent for a previously completed order.
        RETURN NEW;
    ELSIF v_order_status <> 'delivering' THEN
        -- Do NOT finish cancelled, pending, confirmed or preparing orders.
        RAISE EXCEPTION 'Cannot complete delivery when order status is %', v_order_status
          USING ERRCODE = '23514';
    END IF;

    -- Baseline updated_at is a DATE rather than timestamptz.
    UPDATE public.orders AS o
       SET status = 'completed',
           updated_at = CURRENT_DATE
     WHERE o.order_id = NEW.order_id
       AND o.store_id = NEW.store_id
       AND o.status = 'delivering';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order status changed during delivery completion'
          USING ERRCODE = '40001';
    END IF;

    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.fn_complete_order_on_delivery() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_complete_order_on_delivery ON public.deliveries;
CREATE TRIGGER trg_complete_order_on_delivery
AFTER UPDATE OF status ON public.deliveries
FOR EACH ROW
WHEN (NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.fn_complete_order_on_delivery();

-- Repair previous records already marked delivered by Web Shipper.
-- Only matching tenants in 'delivering' may be changed. Cancelled orders
-- and mismatched/unscoped records are intentionally left untouched.
UPDATE public.orders AS o
   SET status = 'completed',
       updated_at = CURRENT_DATE
 WHERE o.status = 'delivering'
   AND o.store_id IS NOT NULL
   AND EXISTS (
       SELECT 1
         FROM public.deliveries AS d
        WHERE d.order_id = o.order_id
          AND d.store_id = o.store_id
          AND d.status = 'delivered'
   );

COMMIT;
