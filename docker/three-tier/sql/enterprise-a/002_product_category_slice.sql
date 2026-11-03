-- GreenPlus Docker lab ONLY. Do NOT run against hosted Supabase.
-- Safe to apply repeatedly to existing demo volumes. Keeps legacy demo_products / price columns.
-- Matches the Product/Category PostgREST slice from packages/tenant-routing/postgrest-adapter.mjs.
-- This adds schema compatibility, NOT production-grade RLS or tenant-authenticated PostgREST.
BEGIN;
CREATE TABLE IF NOT EXISTS public.categories (
  category_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  image_url text,
  created_at date DEFAULT CURRENT_DATE,
  CONSTRAINT categories_store_category_unique UNIQUE (store_id, category_id)
);
-- Preserve demo starter products, including their legacy price column.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit varchar(20) NOT NULL DEFAULT 'unit';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'active';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS nutrition text;
ALTER TABLE public.products ALTER COLUMN price SET DEFAULT 0;
CREATE INDEX IF NOT EXISTS enterprise_products_store_idx ON public.products(store_id);
CREATE INDEX IF NOT EXISTS enterprise_categories_store_idx ON public.categories(store_id);
DO $migration$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.products'::regclass AND conname = 'products_category_store_fk') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_category_store_fk
      FOREIGN KEY (store_id, category_id) REFERENCES public.categories(store_id, category_id);
  END IF;
END
$migration$;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products, public.categories TO web_anon;
COMMIT;
