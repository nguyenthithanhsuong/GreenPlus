-- IMPORTANT: target existing GreenPlus v1 schema (0001-0003 applied).
-- This suite is additive; do not use on a different schema without review.
BEGIN;
-- All current tenant-owned tables, including group buying.
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.prices ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.carts ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.post_interactions ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.post_medias ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.group_buys ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.group_buy_members ADD COLUMN IF NOT EXISTS store_id uuid;
-- NULL until historical rows have been assigned in the following migration.
COMMIT;
