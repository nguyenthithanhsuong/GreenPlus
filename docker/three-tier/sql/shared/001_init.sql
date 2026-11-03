-- Demonstration only. The postgres superuser is used by internal PostgREST containers.
CREATE ROLE web_anon NOLOGIN;
CREATE TABLE public.demo_stores (
 store_id uuid PRIMARY KEY,
 name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
 tier text NOT NULL CHECK (tier IN ('regular','pro','enterprise')),
 slot text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tier, slot, store_id)
);
CREATE TABLE public.demo_products (
 product_id uuid PRIMARY KEY,
 store_id uuid NOT NULL REFERENCES public.demo_stores(store_id),
 name text NOT NULL,
 price numeric(12,2) NOT NULL CHECK(price>=0)
);
CREATE SCHEMA pro_a;
CREATE SCHEMA pro_b;
CREATE TABLE pro_a.products (product_id uuid PRIMARY KEY, store_id uuid NOT NULL, name text NOT NULL, price numeric(12,2) NOT NULL);
CREATE TABLE pro_b.products (product_id uuid PRIMARY KEY, store_id uuid NOT NULL, name text NOT NULL, price numeric(12,2) NOT NULL);
GRANT USAGE ON SCHEMA public,pro_a,pro_b TO web_anon;
GRANT SELECT,INSERT,DELETE ON public.demo_stores,public.demo_products,pro_a.products,pro_b.products TO web_anon;
INSERT INTO public.demo_stores(store_id,name,tier,slot) VALUES
 ('00000000-0000-4000-8000-000000000001','Regular A','regular','shared'),
 ('00000000-0000-4000-8000-000000000002','Regular B','regular','shared');
INSERT INTO public.demo_products(product_id,store_id,name,price) VALUES
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','Organic Apples',39000),
 ('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002','Organic Spinach',25000);
