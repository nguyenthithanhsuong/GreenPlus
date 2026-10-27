-- IMPORTANT: target existing GreenPlus v1 schema (0001-0003 applied).
-- This suite is additive; do not use on a different schema without review.

BEGIN;
-- The supplied dump has exactly one store (GreenPlus UIT).
-- For any environment with 0 or >1 stores, abort rather than guess which tenant owns old rows.
DO $$
DECLARE n bigint;
BEGIN
 SELECT count(*) INTO n FROM public.stores;
 IF n <> 1 THEN
   RAISE EXCEPTION 'Safe backfill requires exactly one existing store; found %. Write a verified row-to-store mapping first.',n;
 END IF;
END $$;

-- Backfill only unassigned historical rows; existing assignment is preserved.
UPDATE public.suppliers SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.categories SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.products SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.batches SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.inventory SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.inventory_transactions SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.prices SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.carts SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.cart_items SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.orders SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.order_items SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.payments SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.deliveries SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.reviews SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.complaints SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.subscriptions SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.posts SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.post_interactions SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.post_medias SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.group_buys SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
UPDATE public.group_buy_members SET store_id = (SELECT store_id FROM public.stores LIMIT 1) WHERE store_id IS NULL;
INSERT INTO public.store_settings(store_id)
SELECT store_id FROM public.stores ON CONFLICT DO NOTHING;

-- Ensure the seeded manager and legacy staff memberships are present.
INSERT INTO public.store_members(store_id,user_id,role_id,status)
SELECT u.store_id,u.user_id,u.role_id,
       CASE WHEN u.status='active' THEN 'active' ELSE 'inactive' END
FROM public.users u JOIN public.roles r ON r.role_id=u.role_id
WHERE u.store_id IS NOT NULL AND u.role_id IS NOT NULL
 AND (coalesce(r.is_manager,false) OR coalesce(r.is_employee,false) OR coalesce(r.is_shipper,false))
ON CONFLICT DO NOTHING;
COMMIT;
