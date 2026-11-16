-- GreenPlus additive RBAC registry + indexed, read-only audit trail.
-- Requires migrations 0001..0018. Do not drop legacy role flags in this release.
-- Apply to a staging copy, inspect grants/row counts, then production in a maintenance window.
BEGIN;

CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE CHECK (key ~ '^[a-z][a-z0-9_.]*$'),
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id uuid NOT NULL REFERENCES public.roles(role_id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission_id);

-- A role is a collection of explicit permissions. Existing flags remain valid in the
-- transitional application; this registry is deliberately not a security cutover.
INSERT INTO public.permissions(key,description)
SELECT p.key, p.description FROM (VALUES
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
ON CONFLICT (key) DO NOTHING;

-- Seed new permissions only for existing built-in roles. Don't grant everything
-- to arbitrary custom roles which happen to set is_admin/is_manager flags.
INSERT INTO public.role_permissions(role_id,permission_id)
SELECT r.role_id, p.id FROM public.roles r CROSS JOIN public.permissions p
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

-- Optional original campaign image, isolated from the product image itself.
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS image_url text;

-- Audit is write-only from app/system code and read-only through authorized server APIs.
-- Never grant browser clients direct SELECT on unredacted before/after JSON.
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_id ON public.audit_logs(created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_created ON public.audit_logs(entity,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created ON public.audit_logs(action,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON public.audit_logs(actor_id,created_at DESC);
REVOKE ALL ON TABLE public.permissions,public.role_permissions,public.audit_logs FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.permissions,public.role_permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Trigger captures a NON-SENSITIVE summary only. Actor cannot be determined in
-- all service-role writes, hence actor_id = NULL (displayed as 'Hệ thống').
-- Explicit application audit writes can set actor_id where known.
CREATE OR REPLACE FUNCTION public.greenplus_audit_business_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE old_row jsonb; new_row jsonb; selected jsonb; audit_store uuid; audit_entity_id uuid;
BEGIN
  old_row := CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
  new_row := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) ELSE '{}'::jsonb END;
  IF TG_OP = 'UPDATE' AND old_row = new_row THEN RETURN NEW; END IF;
  selected := CASE WHEN TG_OP = 'DELETE' THEN old_row ELSE new_row END;
  audit_store := NULLIF(selected->>'store_id','')::uuid;
  -- A deleted store no longer satisfies audit_logs.store_id FK.
  IF TG_TABLE_NAME = 'stores' AND TG_OP = 'DELETE' THEN audit_store := NULL; END IF;
  audit_entity_id := NULLIF(selected->>TG_ARGV[0],'')::uuid;
  INSERT INTO public.audit_logs(store_id, actor_id, action, entity, entity_id, before_data, after_data)
  VALUES (
    audit_store, NULL, TG_TABLE_NAME || '.' || lower(TG_OP), TG_TABLE_NAME, audit_entity_id,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE
      jsonb_strip_nulls(jsonb_build_object('status',old_row->'status','name',old_row->'name',
        'quantity_available',old_row->'quantity_available','quantity_reserved',old_row->'quantity_reserved',
        'discount_value',old_row->'discount_value')) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE
      jsonb_strip_nulls(jsonb_build_object('status',new_row->'status','name',new_row->'name',
        'quantity_available',new_row->'quantity_available','quantity_reserved',new_row->'quantity_reserved',
        'discount_value',new_row->'discount_value')) END
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $fn$;
REVOKE ALL ON FUNCTION public.greenplus_audit_business_change() FROM PUBLIC,anon,authenticated;

-- Tables are present in 0001 and 0009. Avoid users/payments/communications
-- to prevent accidental logging of PII/payment credentials.
CREATE TRIGGER gp_audit_stores AFTER INSERT OR UPDATE OR DELETE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.greenplus_audit_business_change('store_id');
CREATE TRIGGER gp_audit_products AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.greenplus_audit_business_change('product_id');
CREATE TRIGGER gp_audit_inventory AFTER INSERT OR UPDATE OR DELETE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.greenplus_audit_business_change('inventory_id');
CREATE TRIGGER gp_audit_prices AFTER INSERT OR UPDATE OR DELETE ON public.prices
  FOR EACH ROW EXECUTE FUNCTION public.greenplus_audit_business_change('price_id');
CREATE TRIGGER gp_audit_orders AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.greenplus_audit_business_change('order_id');
CREATE TRIGGER gp_audit_promotions AFTER INSERT OR UPDATE OR DELETE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.greenplus_audit_business_change('id');

COMMIT;
