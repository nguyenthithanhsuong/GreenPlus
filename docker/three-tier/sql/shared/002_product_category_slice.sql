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
CREATE TABLE IF NOT EXISTS public.products (
  product_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  category_id uuid,
  name varchar(150) NOT NULL,
  description text,
  unit varchar(20) NOT NULL DEFAULT 'unit',
  image_url text,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz DEFAULT now(),
  nutrition text,
  price numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  CONSTRAINT public_products_category_store_fk
    FOREIGN KEY (store_id, category_id) REFERENCES public.categories(store_id, category_id)
);
CREATE INDEX IF NOT EXISTS shared_products_store_idx ON public.products(store_id);
CREATE INDEX IF NOT EXISTS shared_categories_store_idx ON public.categories(store_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products, public.categories TO web_anon;
-- The two Pro schema names are a fixed, trusted demo allowlist.
DO $migration$
DECLARE tenant_schema text;
BEGIN
  FOREACH tenant_schema IN ARRAY ARRAY['pro_a','pro_b'] LOOP
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I.categories (
      category_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id uuid NOT NULL,
      name varchar(100) NOT NULL,
      description text,
      image_url text,
      created_at date DEFAULT CURRENT_DATE,
      CONSTRAINT categories_store_category_unique UNIQUE (store_id, category_id)
    )', tenant_schema);
    EXECUTE format('ALTER TABLE %I.products ADD COLUMN IF NOT EXISTS category_id uuid', tenant_schema);
    EXECUTE format('ALTER TABLE %I.products ADD COLUMN IF NOT EXISTS description text', tenant_schema);
    EXECUTE format('ALTER TABLE %I.products ADD COLUMN IF NOT EXISTS unit varchar(20) NOT NULL DEFAULT ''unit''', tenant_schema);
    EXECUTE format('ALTER TABLE %I.products ADD COLUMN IF NOT EXISTS image_url text', tenant_schema);
    EXECUTE format('ALTER TABLE %I.products ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT ''active''', tenant_schema);
    EXECUTE format('ALTER TABLE %I.products ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now()', tenant_schema);
    EXECUTE format('ALTER TABLE %I.products ADD COLUMN IF NOT EXISTS nutrition text', tenant_schema);
    EXECUTE format('ALTER TABLE %I.products ALTER COLUMN price SET DEFAULT 0', tenant_schema);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.products (store_id)', tenant_schema || '_products_store_idx', tenant_schema);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.categories (store_id)', tenant_schema || '_categories_store_idx', tenant_schema);
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = format('%I.products', tenant_schema)::regclass AND conname = 'products_category_store_fk') THEN
      EXECUTE format('ALTER TABLE %I.products ADD CONSTRAINT products_category_store_fk FOREIGN KEY (store_id, category_id) REFERENCES %I.categories (store_id, category_id)', tenant_schema, tenant_schema);
    END IF;
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I.products, %I.categories TO web_anon', tenant_schema, tenant_schema);
  END LOOP;
END
$migration$;
COMMIT;
