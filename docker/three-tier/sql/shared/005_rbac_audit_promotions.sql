-- GreenPlus Docker 3-tier ONLY (PostgreSQL 16). DO NOT apply on Supabase.
-- Additive partial schema parity with Supabase 0019: RBAC registry, audit and image promotions.
-- Source 0019 expects full GreenPlus base tables; Docker sandbox has demo tables instead.
-- Safe to reapply, preserves tenant rows and existing volumes. Test on backup/staging first.
-- SQL file runs as database owner via `psql -v ON_ERROR_STOP=1 -f ...`.
BEGIN;
CREATE TABLE IF NOT EXISTS public.demo_schema_migrations (
 schema_name text NOT NULL, migration text NOT NULL,
 applied_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(schema_name,migration)
);
REVOKE ALL ON public.demo_schema_migrations FROM PUBLIC,web_anon;
-- Scope public: Docker local storage, additive adaptation of Supabase 0019.
-- Registry tables are NOT a substitute for server authenticated/RLS identities.
CREATE TABLE IF NOT EXISTS public.roles (
 role_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), role_name varchar(30) NOT NULL UNIQUE,
 description text, is_customer boolean, is_admin boolean, is_manager boolean,
 is_employee boolean, is_shipper boolean
);
CREATE TABLE IF NOT EXISTS public.permissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 key text NOT NULL UNIQUE CHECK (key ~ '^[a-z][a-z0-9_.]*$'),
 description text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.role_permissions (
 role_id uuid NOT NULL REFERENCES public.roles(role_id) ON DELETE CASCADE,
 permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
 PRIMARY KEY (role_id, permission_id)
);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission_id);
-- No USERS table/auth service in Docker demo. UUIDs here are hints, NOT verified identities.
CREATE TABLE IF NOT EXISTS public.store_members (
 store_id uuid NOT NULL, user_id uuid NOT NULL,
 role_id uuid NOT NULL REFERENCES public.roles(role_id),
 status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (store_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_store_members_user_status ON public.store_members(user_id,status);
CREATE TABLE IF NOT EXISTS public.platform_admins (
 user_id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.audit_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), store_id uuid,
 actor_id uuid, action text NOT NULL, entity text NOT NULL, entity_id uuid,
 before_data jsonb, after_data jsonb, request_id text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_store_created ON public.audit_logs(store_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_id ON public.audit_logs(created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_created ON public.audit_logs(entity,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created ON public.audit_logs(action,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON public.audit_logs(actor_id,created_at DESC);
-- Source-of-truth products and business totals belong to each tenant storage scope.
-- Docker has no batches or promotion_suggestions tables yet; do not fabricate FKs.
CREATE UNIQUE INDEX IF NOT EXISTS gp_products_store_identity ON public.products(store_id,product_id);
CREATE TABLE IF NOT EXISTS public.promotions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 store_id uuid NOT NULL,
 scope text NOT NULL CHECK(scope IN ('product','batch')),
 product_id uuid NOT NULL,
 batch_id uuid,
 discount_type text NOT NULL CHECK(discount_type IN ('percentage','fixed_amount')),
 discount_value numeric(12,2) NOT NULL CHECK(discount_value > 0),
 start_at timestamptz NOT NULL,
 end_at timestamptz NOT NULL,
 source text NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','ai_suggestion')),
 suggestion_id uuid,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','paused','expired','cancelled')),
 created_by uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 image_url text,
 CHECK(end_at > start_at),
 CHECK((scope='product' AND batch_id IS NULL) OR (scope='batch' AND batch_id IS NOT NULL)),
 CHECK(discount_type <> 'percentage' OR discount_value <= 100),
 CHECK((source='manual' AND suggestion_id IS NULL) OR (source='ai_suggestion' AND suggestion_id IS NOT NULL)),
 CONSTRAINT gp_promotions_product_store_fk FOREIGN KEY(store_id,product_id)
 REFERENCES public.products(store_id,product_id)
);
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS image_url text;
CREATE INDEX IF NOT EXISTS idx_promotions_store_status_window ON public.promotions(store_id,status,start_at,end_at);
-- Exact keys and built-in role grant rules are generated from Supabase migration 0019.
INSERT INTO public.roles(role_name,description,is_admin,is_manager,is_employee,is_customer,is_shipper) VALUES
 ('Admin','Platform administrator',true,false,false,false,false),
 ('Manager','Store manager',false,true,false,false,false),
 ('Employee','Store employee',false,false,true,false,false),
 ('Customer','Customer',false,false,false,true,false),
 ('Shipper','Delivery worker',false,false,false,false,true)
ON CONFLICT(role_name) DO NOTHING;
INSERT INTO public.permissions(key,description)
SELECT p.key,p.description FROM (VALUES
('auth.login','Đăng nhập'),
 ('users.read','Xem người dùng'), ('users.create','Tạo người dùng'), ('users.update','Sửa người dùng'), ('users.delete','Xóa người dùng'),
 ('roles.read','Xem vai trò'), ('roles.create','Tạo vai trò'), ('roles.update','Sửa vai trò'), ('roles.delete','Xóa vai trò'),
 ('stores.read','Xem cửa hàng'), ('stores.create','Tạo cửa hàng'), ('stores.update','Sửa cửa hàng'), ('stores.delete','Xóa cửa hàng'),
 ('suppliers.read','Xem nhà cung cấp'),('suppliers.create','Tạo nhà cung cấp'),('suppliers.update','Sửa nhà cung cấp'),('suppliers.delete','Xóa nhà cung cấp'),('suppliers.approve','Duyệt nhà cung cấp'),
 ('categories.read','Xem danh mục'),('categories.create','Tạo danh mục'),('categories.update','Sửa danh mục'),('categories.delete','Xóa danh mục'),
 ('products.read','Xem sản phẩm'),('products.create','Tạo sản phẩm'),('products.update','Sửa sản phẩm'),('products.delete','Xóa sản phẩm'),
 ('batches.read','Xem lô hàng'),('batches.create','Tạo lô'),('batches.update','Sửa lô'),('batches.delete','Xóa lô'),('batches.qr_scan','Quét QR lô hàng'),
 ('inventory.read','Xem tồn kho'), ('inventory.update','Sửa tồn kho'),
 ('prices.read','Xem bảng giá'), ('prices.create','Tạo bảng giá'), ('prices.update','Sửa bảng giá'), ('prices.delete','Xóa bảng giá'),
 ('orders.read','Xem đơn hàng'), ('orders.assign','Điều phối đơn hàng'), ('orders.update_status','Cập nhật đơn hàng'),
 ('deliveries.view_assigned','Xem giao vận được phân công'),
 ('content.create','Tạo nội dung'),('content.read','Xem nội dung'),('content.update','Sửa nội dung'),('content.delete','Xóa nội dung'),
 ('reports.business_view','Xem báo cáo kinh doanh'),('reports.customer_analytics','Xem phân tích khách hàng'),('reports.finance','Xem báo cáo tài chính'),
 ('complaints.read','Xem khiếu nại'), ('complaints.update','Xử lý khiếu nại'), ('complaints.moderate','Duyệt khiếu nại'),
 ('greencreator.moderate','Kiểm duyệt Green Creator'),
 ('audit.read','Xem nhật ký'), ('audit.read_platform','Xem nhật ký toàn nền tảng'),
 ('system.manage','Quản trị hệ thống'), ('ai.use','Sử dụng trợ lý AI'),
 ('promotions.read','Xem chương trình khuyến mãi'), ('promotions.manage','Quản lý khuyến mãi')
) AS p(key,description)
ON CONFLICT(key) DO NOTHING;
INSERT INTO public.role_permissions(role_id,permission_id)
SELECT r.role_id,p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE (lower(r.role_name) = 'admin' AND p.key IN (
 'auth.login','users.read','users.create','users.update','users.delete',
 'roles.read','roles.create','roles.update','roles.delete',
 'stores.read','stores.create','stores.update','stores.delete',
 'greencreator.moderate','audit.read','audit.read_platform','system.manage','ai.use'))
OR (lower(r.role_name) = 'manager' AND p.key IN (
 'auth.login','users.read','users.create','users.update','stores.read',
 'suppliers.create','suppliers.read','suppliers.update','suppliers.approve',
 'categories.create','categories.read','categories.update',
 'products.create','products.read','products.update',
 'batches.create','batches.read','batches.update','batches.delete',
 'deliveries.view_assigned','content.create','content.read','content.update','content.delete',
 'reports.business_view','reports.customer_analytics','reports.finance',
 'inventory.read','inventory.update','prices.read','prices.create','prices.update',
 'orders.read','orders.assign','orders.update_status',
 'complaints.read','complaints.update','greencreator.moderate',
 'audit.read','ai.use','promotions.read','promotions.manage'))
OR (lower(r.role_name) = 'employee' AND p.key IN (
 'auth.login','stores.read','suppliers.read','categories.read','products.read',
 'batches.read','batches.qr_scan','deliveries.view_assigned',
 'inventory.read','prices.read','orders.read','orders.update_status',
 'complaints.read','ai.use'))

ON CONFLICT DO NOTHING;
-- Trigger stores only non-sensitive summaries: no identity profiles, payment data, or messages.
CREATE OR REPLACE FUNCTION public.greenplus_audit_business_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $audit$
DECLARE
  old_row jsonb; new_row jsonb; chosen jsonb;
  audit_store uuid; audit_entity_id uuid;
  old_summary jsonb; new_summary jsonb;
BEGIN
  old_row := CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
  new_row := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) ELSE '{}'::jsonb END;
  IF TG_OP = 'UPDATE' AND old_row = new_row THEN RETURN NEW; END IF;
  chosen := CASE WHEN TG_OP = 'DELETE' THEN old_row ELSE new_row END;
  audit_store := NULLIF(chosen->>'store_id','')::uuid;
  audit_entity_id := NULLIF(chosen->>TG_ARGV[0],'')::uuid;
  old_summary := jsonb_strip_nulls(jsonb_build_object(
      'status',old_row->'status','name',old_row->'name',
      'quantity_available',COALESCE(old_row->'quantity_available',old_row->'available'),
      'quantity_reserved',old_row->'quantity_reserved',
      'discount_value',old_row->'discount_value'));
  new_summary := jsonb_strip_nulls(jsonb_build_object(
      'status',new_row->'status','name',new_row->'name',
      'quantity_available',COALESCE(new_row->'quantity_available',new_row->'available'),
      'quantity_reserved',new_row->'quantity_reserved',
      'discount_value',new_row->'discount_value'));
  INSERT INTO public.audit_logs(store_id,actor_id,action,entity,entity_id,before_data,after_data)
  VALUES(audit_store,NULL,TG_TABLE_NAME || '.' || lower(TG_OP),TG_TABLE_NAME,audit_entity_id,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE old_summary END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE new_summary END);
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $audit$;
-- Revocation also protects data if a future gateway route accidentally exposes a table.
REVOKE ALL ON public.roles,public.permissions,public.role_permissions,
  public.store_members,public.platform_admins,public.audit_logs,public.promotions FROM PUBLIC, web_anon;
REVOKE ALL ON FUNCTION public.greenplus_audit_business_change() FROM PUBLIC,web_anon;
-- RLS enabled with NO public policies: only privileged migration/runtime users can inspect.
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS gp_audit_products ON public.products;
CREATE TRIGGER gp_audit_products AFTER INSERT OR UPDATE OR DELETE ON public.products
 FOR EACH ROW EXECUTE FUNCTION public.greenplus_audit_business_change('product_id');
DROP TRIGGER IF EXISTS gp_audit_inventory_stock ON public.inventory_stock;
CREATE TRIGGER gp_audit_inventory_stock AFTER INSERT OR UPDATE OR DELETE ON public.inventory_stock
 FOR EACH ROW EXECUTE FUNCTION public.greenplus_audit_business_change('product_id');
DROP TRIGGER IF EXISTS gp_audit_commerce_orders ON public.commerce_orders;
CREATE TRIGGER gp_audit_commerce_orders AFTER INSERT OR UPDATE OR DELETE ON public.commerce_orders
 FOR EACH ROW EXECUTE FUNCTION public.greenplus_audit_business_change('order_id');
DROP TRIGGER IF EXISTS gp_audit_promotions ON public.promotions;
CREATE TRIGGER gp_audit_promotions AFTER INSERT OR UPDATE OR DELETE ON public.promotions
 FOR EACH ROW EXECUTE FUNCTION public.greenplus_audit_business_change('id');
DO $only_shared$
BEGIN
 IF to_regclass('public.demo_stores') IS NOT NULL THEN
   EXECUTE 'DROP TRIGGER IF EXISTS gp_audit_demo_stores ON public.demo_stores';
   EXECUTE 'CREATE TRIGGER gp_audit_demo_stores AFTER INSERT OR UPDATE OR DELETE ON public.demo_stores FOR EACH ROW EXECUTE FUNCTION public.greenplus_audit_business_change(''store_id'')';
 END IF;
END $only_shared$;
DO $only_shared$
BEGIN
 IF to_regclass('public.demo_products') IS NOT NULL THEN
   EXECUTE 'DROP TRIGGER IF EXISTS gp_audit_demo_products ON public.demo_products';
   EXECUTE 'CREATE TRIGGER gp_audit_demo_products AFTER INSERT OR UPDATE OR DELETE ON public.demo_products FOR EACH ROW EXECUTE FUNCTION public.greenplus_audit_business_change(''product_id'')';
 END IF;
END $only_shared$;
INSERT INTO public.demo_schema_migrations(schema_name,migration) VALUES('public','005_rbac_audit_promotions')
ON CONFLICT (schema_name,migration) DO NOTHING;
-- Scope pro_a: Docker local storage, additive adaptation of Supabase 0019.
-- Registry tables are NOT a substitute for server authenticated/RLS identities.
CREATE TABLE IF NOT EXISTS pro_a.roles (
 role_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), role_name varchar(30) NOT NULL UNIQUE,
 description text, is_customer boolean, is_admin boolean, is_manager boolean,
 is_employee boolean, is_shipper boolean
);
CREATE TABLE IF NOT EXISTS pro_a.permissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 key text NOT NULL UNIQUE CHECK (key ~ '^[a-z][a-z0-9_.]*$'),
 description text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS pro_a.role_permissions (
 role_id uuid NOT NULL REFERENCES pro_a.roles(role_id) ON DELETE CASCADE,
 permission_id uuid NOT NULL REFERENCES pro_a.permissions(id) ON DELETE CASCADE,
 PRIMARY KEY (role_id, permission_id)
);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON pro_a.role_permissions(permission_id);
-- No USERS table/auth service in Docker demo. UUIDs here are hints, NOT verified identities.
CREATE TABLE IF NOT EXISTS pro_a.store_members (
 store_id uuid NOT NULL, user_id uuid NOT NULL,
 role_id uuid NOT NULL REFERENCES pro_a.roles(role_id),
 status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (store_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_store_members_user_status ON pro_a.store_members(user_id,status);
CREATE TABLE IF NOT EXISTS pro_a.platform_admins (
 user_id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS pro_a.audit_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), store_id uuid,
 actor_id uuid, action text NOT NULL, entity text NOT NULL, entity_id uuid,
 before_data jsonb, after_data jsonb, request_id text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_store_created ON pro_a.audit_logs(store_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_id ON pro_a.audit_logs(created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_created ON pro_a.audit_logs(entity,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created ON pro_a.audit_logs(action,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON pro_a.audit_logs(actor_id,created_at DESC);
-- Source-of-truth products and business totals belong to each tenant storage scope.
-- Docker has no batches or promotion_suggestions tables yet; do not fabricate FKs.
CREATE UNIQUE INDEX IF NOT EXISTS gp_products_store_identity ON pro_a.products(store_id,product_id);
CREATE TABLE IF NOT EXISTS pro_a.promotions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 store_id uuid NOT NULL,
 scope text NOT NULL CHECK(scope IN ('product','batch')),
 product_id uuid NOT NULL,
 batch_id uuid,
 discount_type text NOT NULL CHECK(discount_type IN ('percentage','fixed_amount')),
 discount_value numeric(12,2) NOT NULL CHECK(discount_value > 0),
 start_at timestamptz NOT NULL,
 end_at timestamptz NOT NULL,
 source text NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','ai_suggestion')),
 suggestion_id uuid,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','paused','expired','cancelled')),
 created_by uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 image_url text,
 CHECK(end_at > start_at),
 CHECK((scope='product' AND batch_id IS NULL) OR (scope='batch' AND batch_id IS NOT NULL)),
 CHECK(discount_type <> 'percentage' OR discount_value <= 100),
 CHECK((source='manual' AND suggestion_id IS NULL) OR (source='ai_suggestion' AND suggestion_id IS NOT NULL)),
 CONSTRAINT gp_promotions_product_store_fk FOREIGN KEY(store_id,product_id)
 REFERENCES pro_a.products(store_id,product_id)
);
ALTER TABLE pro_a.promotions ADD COLUMN IF NOT EXISTS image_url text;
CREATE INDEX IF NOT EXISTS idx_promotions_store_status_window ON pro_a.promotions(store_id,status,start_at,end_at);
-- Exact keys and built-in role grant rules are generated from Supabase migration 0019.
INSERT INTO pro_a.roles(role_name,description,is_admin,is_manager,is_employee,is_customer,is_shipper) VALUES
 ('Admin','Platform administrator',true,false,false,false,false),
 ('Manager','Store manager',false,true,false,false,false),
 ('Employee','Store employee',false,false,true,false,false),
 ('Customer','Customer',false,false,false,true,false),
 ('Shipper','Delivery worker',false,false,false,false,true)
ON CONFLICT(role_name) DO NOTHING;
INSERT INTO pro_a.permissions(key,description)
SELECT p.key,p.description FROM (VALUES
('auth.login','Đăng nhập'),
 ('users.read','Xem người dùng'), ('users.create','Tạo người dùng'), ('users.update','Sửa người dùng'), ('users.delete','Xóa người dùng'),
 ('roles.read','Xem vai trò'), ('roles.create','Tạo vai trò'), ('roles.update','Sửa vai trò'), ('roles.delete','Xóa vai trò'),
 ('stores.read','Xem cửa hàng'), ('stores.create','Tạo cửa hàng'), ('stores.update','Sửa cửa hàng'), ('stores.delete','Xóa cửa hàng'),
 ('suppliers.read','Xem nhà cung cấp'),('suppliers.create','Tạo nhà cung cấp'),('suppliers.update','Sửa nhà cung cấp'),('suppliers.delete','Xóa nhà cung cấp'),('suppliers.approve','Duyệt nhà cung cấp'),
 ('categories.read','Xem danh mục'),('categories.create','Tạo danh mục'),('categories.update','Sửa danh mục'),('categories.delete','Xóa danh mục'),
 ('products.read','Xem sản phẩm'),('products.create','Tạo sản phẩm'),('products.update','Sửa sản phẩm'),('products.delete','Xóa sản phẩm'),
 ('batches.read','Xem lô hàng'),('batches.create','Tạo lô'),('batches.update','Sửa lô'),('batches.delete','Xóa lô'),('batches.qr_scan','Quét QR lô hàng'),
 ('inventory.read','Xem tồn kho'), ('inventory.update','Sửa tồn kho'),
 ('prices.read','Xem bảng giá'), ('prices.create','Tạo bảng giá'), ('prices.update','Sửa bảng giá'), ('prices.delete','Xóa bảng giá'),
 ('orders.read','Xem đơn hàng'), ('orders.assign','Điều phối đơn hàng'), ('orders.update_status','Cập nhật đơn hàng'),
 ('deliveries.view_assigned','Xem giao vận được phân công'),
 ('content.create','Tạo nội dung'),('content.read','Xem nội dung'),('content.update','Sửa nội dung'),('content.delete','Xóa nội dung'),
 ('reports.business_view','Xem báo cáo kinh doanh'),('reports.customer_analytics','Xem phân tích khách hàng'),('reports.finance','Xem báo cáo tài chính'),
 ('complaints.read','Xem khiếu nại'), ('complaints.update','Xử lý khiếu nại'), ('complaints.moderate','Duyệt khiếu nại'),
 ('greencreator.moderate','Kiểm duyệt Green Creator'),
 ('audit.read','Xem nhật ký'), ('audit.read_platform','Xem nhật ký toàn nền tảng'),
 ('system.manage','Quản trị hệ thống'), ('ai.use','Sử dụng trợ lý AI'),
 ('promotions.read','Xem chương trình khuyến mãi'), ('promotions.manage','Quản lý khuyến mãi')
) AS p(key,description)
ON CONFLICT(key) DO NOTHING;
INSERT INTO pro_a.role_permissions(role_id,permission_id)
SELECT r.role_id,p.id FROM pro_a.roles r CROSS JOIN pro_a.permissions p
WHERE (lower(r.role_name) = 'admin' AND p.key IN (
 'auth.login','users.read','users.create','users.update','users.delete',
 'roles.read','roles.create','roles.update','roles.delete',
 'stores.read','stores.create','stores.update','stores.delete',
 'greencreator.moderate','audit.read','audit.read_platform','system.manage','ai.use'))
OR (lower(r.role_name) = 'manager' AND p.key IN (
 'auth.login','users.read','users.create','users.update','stores.read',
 'suppliers.create','suppliers.read','suppliers.update','suppliers.approve',
 'categories.create','categories.read','categories.update',
 'products.create','products.read','products.update',
 'batches.create','batches.read','batches.update','batches.delete',
 'deliveries.view_assigned','content.create','content.read','content.update','content.delete',
 'reports.business_view','reports.customer_analytics','reports.finance',
 'inventory.read','inventory.update','prices.read','prices.create','prices.update',
 'orders.read','orders.assign','orders.update_status',
 'complaints.read','complaints.update','greencreator.moderate',
 'audit.read','ai.use','promotions.read','promotions.manage'))
OR (lower(r.role_name) = 'employee' AND p.key IN (
 'auth.login','stores.read','suppliers.read','categories.read','products.read',
 'batches.read','batches.qr_scan','deliveries.view_assigned',
 'inventory.read','prices.read','orders.read','orders.update_status',
 'complaints.read','ai.use'))

ON CONFLICT DO NOTHING;
-- Trigger stores only non-sensitive summaries: no identity profiles, payment data, or messages.
CREATE OR REPLACE FUNCTION pro_a.greenplus_audit_business_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $audit$
DECLARE
  old_row jsonb; new_row jsonb; chosen jsonb;
  audit_store uuid; audit_entity_id uuid;
  old_summary jsonb; new_summary jsonb;
BEGIN
  old_row := CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
  new_row := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) ELSE '{}'::jsonb END;
  IF TG_OP = 'UPDATE' AND old_row = new_row THEN RETURN NEW; END IF;
  chosen := CASE WHEN TG_OP = 'DELETE' THEN old_row ELSE new_row END;
  audit_store := NULLIF(chosen->>'store_id','')::uuid;
  audit_entity_id := NULLIF(chosen->>TG_ARGV[0],'')::uuid;
  old_summary := jsonb_strip_nulls(jsonb_build_object(
      'status',old_row->'status','name',old_row->'name',
      'quantity_available',COALESCE(old_row->'quantity_available',old_row->'available'),
      'quantity_reserved',old_row->'quantity_reserved',
      'discount_value',old_row->'discount_value'));
  new_summary := jsonb_strip_nulls(jsonb_build_object(
      'status',new_row->'status','name',new_row->'name',
      'quantity_available',COALESCE(new_row->'quantity_available',new_row->'available'),
      'quantity_reserved',new_row->'quantity_reserved',
      'discount_value',new_row->'discount_value'));
  INSERT INTO pro_a.audit_logs(store_id,actor_id,action,entity,entity_id,before_data,after_data)
  VALUES(audit_store,NULL,TG_TABLE_NAME || '.' || lower(TG_OP),TG_TABLE_NAME,audit_entity_id,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE old_summary END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE new_summary END);
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $audit$;
-- Revocation also protects data if a future gateway route accidentally exposes a table.
REVOKE ALL ON pro_a.roles,pro_a.permissions,pro_a.role_permissions,
  pro_a.store_members,pro_a.platform_admins,pro_a.audit_logs,pro_a.promotions FROM PUBLIC, web_anon;
REVOKE ALL ON FUNCTION pro_a.greenplus_audit_business_change() FROM PUBLIC,web_anon;
-- RLS enabled with NO public policies: only privileged migration/runtime users can inspect.
ALTER TABLE pro_a.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_a.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_a.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_a.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_a.store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_a.platform_admins ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS gp_audit_products ON pro_a.products;
CREATE TRIGGER gp_audit_products AFTER INSERT OR UPDATE OR DELETE ON pro_a.products
 FOR EACH ROW EXECUTE FUNCTION pro_a.greenplus_audit_business_change('product_id');
DROP TRIGGER IF EXISTS gp_audit_inventory_stock ON pro_a.inventory_stock;
CREATE TRIGGER gp_audit_inventory_stock AFTER INSERT OR UPDATE OR DELETE ON pro_a.inventory_stock
 FOR EACH ROW EXECUTE FUNCTION pro_a.greenplus_audit_business_change('product_id');
DROP TRIGGER IF EXISTS gp_audit_commerce_orders ON pro_a.commerce_orders;
CREATE TRIGGER gp_audit_commerce_orders AFTER INSERT OR UPDATE OR DELETE ON pro_a.commerce_orders
 FOR EACH ROW EXECUTE FUNCTION pro_a.greenplus_audit_business_change('order_id');
DROP TRIGGER IF EXISTS gp_audit_promotions ON pro_a.promotions;
CREATE TRIGGER gp_audit_promotions AFTER INSERT OR UPDATE OR DELETE ON pro_a.promotions
 FOR EACH ROW EXECUTE FUNCTION pro_a.greenplus_audit_business_change('id');
INSERT INTO public.demo_schema_migrations(schema_name,migration) VALUES('pro_a','005_rbac_audit_promotions')
ON CONFLICT (schema_name,migration) DO NOTHING;
-- Scope pro_b: Docker local storage, additive adaptation of Supabase 0019.
-- Registry tables are NOT a substitute for server authenticated/RLS identities.
CREATE TABLE IF NOT EXISTS pro_b.roles (
 role_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), role_name varchar(30) NOT NULL UNIQUE,
 description text, is_customer boolean, is_admin boolean, is_manager boolean,
 is_employee boolean, is_shipper boolean
);
CREATE TABLE IF NOT EXISTS pro_b.permissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 key text NOT NULL UNIQUE CHECK (key ~ '^[a-z][a-z0-9_.]*$'),
 description text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS pro_b.role_permissions (
 role_id uuid NOT NULL REFERENCES pro_b.roles(role_id) ON DELETE CASCADE,
 permission_id uuid NOT NULL REFERENCES pro_b.permissions(id) ON DELETE CASCADE,
 PRIMARY KEY (role_id, permission_id)
);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON pro_b.role_permissions(permission_id);
-- No USERS table/auth service in Docker demo. UUIDs here are hints, NOT verified identities.
CREATE TABLE IF NOT EXISTS pro_b.store_members (
 store_id uuid NOT NULL, user_id uuid NOT NULL,
 role_id uuid NOT NULL REFERENCES pro_b.roles(role_id),
 status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (store_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_store_members_user_status ON pro_b.store_members(user_id,status);
CREATE TABLE IF NOT EXISTS pro_b.platform_admins (
 user_id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS pro_b.audit_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), store_id uuid,
 actor_id uuid, action text NOT NULL, entity text NOT NULL, entity_id uuid,
 before_data jsonb, after_data jsonb, request_id text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_store_created ON pro_b.audit_logs(store_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_id ON pro_b.audit_logs(created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_created ON pro_b.audit_logs(entity,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created ON pro_b.audit_logs(action,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON pro_b.audit_logs(actor_id,created_at DESC);
-- Source-of-truth products and business totals belong to each tenant storage scope.
-- Docker has no batches or promotion_suggestions tables yet; do not fabricate FKs.
CREATE UNIQUE INDEX IF NOT EXISTS gp_products_store_identity ON pro_b.products(store_id,product_id);
CREATE TABLE IF NOT EXISTS pro_b.promotions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 store_id uuid NOT NULL,
 scope text NOT NULL CHECK(scope IN ('product','batch')),
 product_id uuid NOT NULL,
 batch_id uuid,
 discount_type text NOT NULL CHECK(discount_type IN ('percentage','fixed_amount')),
 discount_value numeric(12,2) NOT NULL CHECK(discount_value > 0),
 start_at timestamptz NOT NULL,
 end_at timestamptz NOT NULL,
 source text NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','ai_suggestion')),
 suggestion_id uuid,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','paused','expired','cancelled')),
 created_by uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 image_url text,
 CHECK(end_at > start_at),
 CHECK((scope='product' AND batch_id IS NULL) OR (scope='batch' AND batch_id IS NOT NULL)),
 CHECK(discount_type <> 'percentage' OR discount_value <= 100),
 CHECK((source='manual' AND suggestion_id IS NULL) OR (source='ai_suggestion' AND suggestion_id IS NOT NULL)),
 CONSTRAINT gp_promotions_product_store_fk FOREIGN KEY(store_id,product_id)
 REFERENCES pro_b.products(store_id,product_id)
);
ALTER TABLE pro_b.promotions ADD COLUMN IF NOT EXISTS image_url text;
CREATE INDEX IF NOT EXISTS idx_promotions_store_status_window ON pro_b.promotions(store_id,status,start_at,end_at);
-- Exact keys and built-in role grant rules are generated from Supabase migration 0019.
INSERT INTO pro_b.roles(role_name,description,is_admin,is_manager,is_employee,is_customer,is_shipper) VALUES
 ('Admin','Platform administrator',true,false,false,false,false),
 ('Manager','Store manager',false,true,false,false,false),
 ('Employee','Store employee',false,false,true,false,false),
 ('Customer','Customer',false,false,false,true,false),
 ('Shipper','Delivery worker',false,false,false,false,true)
ON CONFLICT(role_name) DO NOTHING;
INSERT INTO pro_b.permissions(key,description)
SELECT p.key,p.description FROM (VALUES
('auth.login','Đăng nhập'),
 ('users.read','Xem người dùng'), ('users.create','Tạo người dùng'), ('users.update','Sửa người dùng'), ('users.delete','Xóa người dùng'),
 ('roles.read','Xem vai trò'), ('roles.create','Tạo vai trò'), ('roles.update','Sửa vai trò'), ('roles.delete','Xóa vai trò'),
 ('stores.read','Xem cửa hàng'), ('stores.create','Tạo cửa hàng'), ('stores.update','Sửa cửa hàng'), ('stores.delete','Xóa cửa hàng'),
 ('suppliers.read','Xem nhà cung cấp'),('suppliers.create','Tạo nhà cung cấp'),('suppliers.update','Sửa nhà cung cấp'),('suppliers.delete','Xóa nhà cung cấp'),('suppliers.approve','Duyệt nhà cung cấp'),
 ('categories.read','Xem danh mục'),('categories.create','Tạo danh mục'),('categories.update','Sửa danh mục'),('categories.delete','Xóa danh mục'),
 ('products.read','Xem sản phẩm'),('products.create','Tạo sản phẩm'),('products.update','Sửa sản phẩm'),('products.delete','Xóa sản phẩm'),
 ('batches.read','Xem lô hàng'),('batches.create','Tạo lô'),('batches.update','Sửa lô'),('batches.delete','Xóa lô'),('batches.qr_scan','Quét QR lô hàng'),
 ('inventory.read','Xem tồn kho'), ('inventory.update','Sửa tồn kho'),
 ('prices.read','Xem bảng giá'), ('prices.create','Tạo bảng giá'), ('prices.update','Sửa bảng giá'), ('prices.delete','Xóa bảng giá'),
 ('orders.read','Xem đơn hàng'), ('orders.assign','Điều phối đơn hàng'), ('orders.update_status','Cập nhật đơn hàng'),
 ('deliveries.view_assigned','Xem giao vận được phân công'),
 ('content.create','Tạo nội dung'),('content.read','Xem nội dung'),('content.update','Sửa nội dung'),('content.delete','Xóa nội dung'),
 ('reports.business_view','Xem báo cáo kinh doanh'),('reports.customer_analytics','Xem phân tích khách hàng'),('reports.finance','Xem báo cáo tài chính'),
 ('complaints.read','Xem khiếu nại'), ('complaints.update','Xử lý khiếu nại'), ('complaints.moderate','Duyệt khiếu nại'),
 ('greencreator.moderate','Kiểm duyệt Green Creator'),
 ('audit.read','Xem nhật ký'), ('audit.read_platform','Xem nhật ký toàn nền tảng'),
 ('system.manage','Quản trị hệ thống'), ('ai.use','Sử dụng trợ lý AI'),
 ('promotions.read','Xem chương trình khuyến mãi'), ('promotions.manage','Quản lý khuyến mãi')
) AS p(key,description)
ON CONFLICT(key) DO NOTHING;
INSERT INTO pro_b.role_permissions(role_id,permission_id)
SELECT r.role_id,p.id FROM pro_b.roles r CROSS JOIN pro_b.permissions p
WHERE (lower(r.role_name) = 'admin' AND p.key IN (
 'auth.login','users.read','users.create','users.update','users.delete',
 'roles.read','roles.create','roles.update','roles.delete',
 'stores.read','stores.create','stores.update','stores.delete',
 'greencreator.moderate','audit.read','audit.read_platform','system.manage','ai.use'))
OR (lower(r.role_name) = 'manager' AND p.key IN (
 'auth.login','users.read','users.create','users.update','stores.read',
 'suppliers.create','suppliers.read','suppliers.update','suppliers.approve',
 'categories.create','categories.read','categories.update',
 'products.create','products.read','products.update',
 'batches.create','batches.read','batches.update','batches.delete',
 'deliveries.view_assigned','content.create','content.read','content.update','content.delete',
 'reports.business_view','reports.customer_analytics','reports.finance',
 'inventory.read','inventory.update','prices.read','prices.create','prices.update',
 'orders.read','orders.assign','orders.update_status',
 'complaints.read','complaints.update','greencreator.moderate',
 'audit.read','ai.use','promotions.read','promotions.manage'))
OR (lower(r.role_name) = 'employee' AND p.key IN (
 'auth.login','stores.read','suppliers.read','categories.read','products.read',
 'batches.read','batches.qr_scan','deliveries.view_assigned',
 'inventory.read','prices.read','orders.read','orders.update_status',
 'complaints.read','ai.use'))

ON CONFLICT DO NOTHING;
-- Trigger stores only non-sensitive summaries: no identity profiles, payment data, or messages.
CREATE OR REPLACE FUNCTION pro_b.greenplus_audit_business_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $audit$
DECLARE
  old_row jsonb; new_row jsonb; chosen jsonb;
  audit_store uuid; audit_entity_id uuid;
  old_summary jsonb; new_summary jsonb;
BEGIN
  old_row := CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
  new_row := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) ELSE '{}'::jsonb END;
  IF TG_OP = 'UPDATE' AND old_row = new_row THEN RETURN NEW; END IF;
  chosen := CASE WHEN TG_OP = 'DELETE' THEN old_row ELSE new_row END;
  audit_store := NULLIF(chosen->>'store_id','')::uuid;
  audit_entity_id := NULLIF(chosen->>TG_ARGV[0],'')::uuid;
  old_summary := jsonb_strip_nulls(jsonb_build_object(
      'status',old_row->'status','name',old_row->'name',
      'quantity_available',COALESCE(old_row->'quantity_available',old_row->'available'),
      'quantity_reserved',old_row->'quantity_reserved',
      'discount_value',old_row->'discount_value'));
  new_summary := jsonb_strip_nulls(jsonb_build_object(
      'status',new_row->'status','name',new_row->'name',
      'quantity_available',COALESCE(new_row->'quantity_available',new_row->'available'),
      'quantity_reserved',new_row->'quantity_reserved',
      'discount_value',new_row->'discount_value'));
  INSERT INTO pro_b.audit_logs(store_id,actor_id,action,entity,entity_id,before_data,after_data)
  VALUES(audit_store,NULL,TG_TABLE_NAME || '.' || lower(TG_OP),TG_TABLE_NAME,audit_entity_id,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE old_summary END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE new_summary END);
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $audit$;
-- Revocation also protects data if a future gateway route accidentally exposes a table.
REVOKE ALL ON pro_b.roles,pro_b.permissions,pro_b.role_permissions,
  pro_b.store_members,pro_b.platform_admins,pro_b.audit_logs,pro_b.promotions FROM PUBLIC, web_anon;
REVOKE ALL ON FUNCTION pro_b.greenplus_audit_business_change() FROM PUBLIC,web_anon;
-- RLS enabled with NO public policies: only privileged migration/runtime users can inspect.
ALTER TABLE pro_b.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_b.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_b.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_b.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_b.store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_b.platform_admins ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS gp_audit_products ON pro_b.products;
CREATE TRIGGER gp_audit_products AFTER INSERT OR UPDATE OR DELETE ON pro_b.products
 FOR EACH ROW EXECUTE FUNCTION pro_b.greenplus_audit_business_change('product_id');
DROP TRIGGER IF EXISTS gp_audit_inventory_stock ON pro_b.inventory_stock;
CREATE TRIGGER gp_audit_inventory_stock AFTER INSERT OR UPDATE OR DELETE ON pro_b.inventory_stock
 FOR EACH ROW EXECUTE FUNCTION pro_b.greenplus_audit_business_change('product_id');
DROP TRIGGER IF EXISTS gp_audit_commerce_orders ON pro_b.commerce_orders;
CREATE TRIGGER gp_audit_commerce_orders AFTER INSERT OR UPDATE OR DELETE ON pro_b.commerce_orders
 FOR EACH ROW EXECUTE FUNCTION pro_b.greenplus_audit_business_change('order_id');
DROP TRIGGER IF EXISTS gp_audit_promotions ON pro_b.promotions;
CREATE TRIGGER gp_audit_promotions AFTER INSERT OR UPDATE OR DELETE ON pro_b.promotions
 FOR EACH ROW EXECUTE FUNCTION pro_b.greenplus_audit_business_change('id');
INSERT INTO public.demo_schema_migrations(schema_name,migration) VALUES('pro_b','005_rbac_audit_promotions')
ON CONFLICT (schema_name,migration) DO NOTHING;
COMMIT;
NOTIFY pgrst, 'reload schema';
