-- Phase A / expand: allow NULL for legacy writes during application rollout.
-- Existing rows were backfilled in 0006. New code MUST explicitly supply store_id.
BEGIN;
CREATE INDEX IF NOT EXISTS idx_suppliers_store_id ON public.suppliers(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.suppliers'::regclass AND conname='suppliers_store_id_fkey') THEN
  ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON public.categories(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.categories'::regclass AND conname='categories_store_id_fkey') THEN
  ALTER TABLE public.categories ADD CONSTRAINT categories_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.products'::regclass AND conname='products_store_id_fkey') THEN
  ALTER TABLE public.products ADD CONSTRAINT products_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_batches_store_id ON public.batches(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.batches'::regclass AND conname='batches_store_id_fkey') THEN
  ALTER TABLE public.batches ADD CONSTRAINT batches_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_inventory_store_id ON public.inventory(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.inventory'::regclass AND conname='inventory_store_id_fkey') THEN
  ALTER TABLE public.inventory ADD CONSTRAINT inventory_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_store_id ON public.inventory_transactions(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.inventory_transactions'::regclass AND conname='inventory_transactions_store_id_fkey') THEN
  ALTER TABLE public.inventory_transactions ADD CONSTRAINT inventory_transactions_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_prices_store_id ON public.prices(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.prices'::regclass AND conname='prices_store_id_fkey') THEN
  ALTER TABLE public.prices ADD CONSTRAINT prices_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_carts_store_id ON public.carts(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.carts'::regclass AND conname='carts_store_id_fkey') THEN
  ALTER TABLE public.carts ADD CONSTRAINT carts_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_cart_items_store_id ON public.cart_items(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.cart_items'::regclass AND conname='cart_items_store_id_fkey') THEN
  ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.orders'::regclass AND conname='orders_store_id_fkey') THEN
  ALTER TABLE public.orders ADD CONSTRAINT orders_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_order_items_store_id ON public.order_items(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.order_items'::regclass AND conname='order_items_store_id_fkey') THEN
  ALTER TABLE public.order_items ADD CONSTRAINT order_items_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_payments_store_id ON public.payments(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.payments'::regclass AND conname='payments_store_id_fkey') THEN
  ALTER TABLE public.payments ADD CONSTRAINT payments_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_deliveries_store_id ON public.deliveries(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.deliveries'::regclass AND conname='deliveries_store_id_fkey') THEN
  ALTER TABLE public.deliveries ADD CONSTRAINT deliveries_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_reviews_store_id ON public.reviews(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.reviews'::regclass AND conname='reviews_store_id_fkey') THEN
  ALTER TABLE public.reviews ADD CONSTRAINT reviews_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_complaints_store_id ON public.complaints(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.complaints'::regclass AND conname='complaints_store_id_fkey') THEN
  ALTER TABLE public.complaints ADD CONSTRAINT complaints_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_subscriptions_store_id ON public.subscriptions(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.subscriptions'::regclass AND conname='subscriptions_store_id_fkey') THEN
  ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_posts_store_id ON public.posts(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.posts'::regclass AND conname='posts_store_id_fkey') THEN
  ALTER TABLE public.posts ADD CONSTRAINT posts_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_post_interactions_store_id ON public.post_interactions(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.post_interactions'::regclass AND conname='post_interactions_store_id_fkey') THEN
  ALTER TABLE public.post_interactions ADD CONSTRAINT post_interactions_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_post_medias_store_id ON public.post_medias(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.post_medias'::regclass AND conname='post_medias_store_id_fkey') THEN
  ALTER TABLE public.post_medias ADD CONSTRAINT post_medias_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_group_buys_store_id ON public.group_buys(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.group_buys'::regclass AND conname='group_buys_store_id_fkey') THEN
  ALTER TABLE public.group_buys ADD CONSTRAINT group_buys_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
CREATE INDEX IF NOT EXISTS idx_group_buy_members_store_id ON public.group_buy_members(store_id);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.group_buy_members'::regclass AND conname='group_buy_members_store_id_fkey') THEN
  ALTER TABLE public.group_buy_members ADD CONSTRAINT group_buy_members_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(store_id) NOT VALID;
 END IF;
END $do$;
COMMIT;
