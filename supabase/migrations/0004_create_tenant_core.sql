-- IMPORTANT: target existing GreenPlus v1 schema (0001-0003 applied).
-- This suite is additive; do not use on a different schema without review.

BEGIN;

-- GreenPlus uses custom gpc1 sessions and public.users.user_id; no auth.uid() mapping is required.

CREATE TABLE IF NOT EXISTS public.store_members (
  store_id uuid NOT NULL REFERENCES public.stores(store_id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
  role_id uuid NOT NULL REFERENCES public.roles(role_id),
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (store_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_store_members_user_status ON public.store_members(user_id,status);

CREATE TABLE IF NOT EXISTS public.store_settings (
  store_id uuid PRIMARY KEY REFERENCES public.stores(store_id) ON DELETE RESTRICT,
  theme varchar(20) NOT NULL DEFAULT 'light' CHECK (theme IN ('light','dark','system')),
  logo_url text,
  currency varchar(3) NOT NULL DEFAULT 'VND',
  shipping_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Secrets MUST NOT be stored here in plaintext; store reference IDs only.
  payment_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  feature_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Platform administrators are explicitly assigned, never inferred from store membership.
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES public.users(user_id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(store_id), -- NULL for platform events
  actor_id uuid REFERENCES public.users(user_id),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  request_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_store_created ON public.audit_logs(store_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  device_id text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('android','ios','web')),
  push_token text,
  enabled boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz,
  UNIQUE(user_id, device_id)
);

-- Keep old users.store_id as a legacy/default-store hint during transition.
-- Do not treat it as the complete authorization model.
INSERT INTO public.store_settings(store_id)
SELECT store_id FROM public.stores
ON CONFLICT (store_id) DO NOTHING;

-- Existing store manager gets membership as Manager role.
INSERT INTO public.store_members(store_id,user_id,role_id,status)
SELECT s.store_id,s.manager_id,r.role_id,'active'
FROM public.stores s CROSS JOIN LATERAL
 (SELECT role_id FROM public.roles WHERE lower(role_name)='manager' LIMIT 1) r
ON CONFLICT (store_id,user_id) DO NOTHING;

-- Only internal staff linked to a store are migrated into membership.
INSERT INTO public.store_members(store_id,user_id,role_id,status)
SELECT u.store_id,u.user_id,u.role_id,
       CASE WHEN u.status='active' THEN 'active' ELSE 'inactive' END
FROM public.users u JOIN public.roles r ON r.role_id=u.role_id
WHERE u.store_id IS NOT NULL AND u.role_id IS NOT NULL
  AND (coalesce(r.is_manager,false) OR coalesce(r.is_employee,false) OR coalesce(r.is_shipper,false))
ON CONFLICT (store_id,user_id) DO NOTHING;

-- Existing admin roles become explicit platform admins. Review before production.
INSERT INTO public.platform_admins(user_id)
SELECT u.user_id FROM public.users u JOIN public.roles r ON r.role_id=u.role_id
WHERE coalesce(r.is_admin,false)
ON CONFLICT (user_id) DO NOTHING;

COMMIT;
