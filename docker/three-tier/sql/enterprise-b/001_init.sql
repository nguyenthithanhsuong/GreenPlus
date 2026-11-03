CREATE ROLE web_anon NOLOGIN;
CREATE TABLE public.products (
 product_id uuid PRIMARY KEY,
 store_id uuid NOT NULL,
 name text NOT NULL,
 price numeric(12,2) NOT NULL CHECK(price>=0)
);
GRANT USAGE ON SCHEMA public TO web_anon;
GRANT SELECT,INSERT,DELETE ON public.products TO web_anon;
