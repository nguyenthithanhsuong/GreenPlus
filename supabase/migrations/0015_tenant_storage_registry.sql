-- PREPARATORY migration only; it does not move any existing business data.
-- Run only after reviewing the tenant provisioner and authorization model.
BEGIN;

CREATE TABLE IF NOT EXISTS public.tenant_storage_registry (
  store_id uuid PRIMARY KEY REFERENCES public.stores(store_id) ON DELETE RESTRICT,
  storage_tier text NOT NULL DEFAULT 'regular' CHECK (storage_tier IN ('regular','pro','enterprise')),
  storage_provider text NOT NULL DEFAULT 'supabase-postgres' CHECK (storage_provider IN ('supabase-postgres','docker-postgres','external-postgres')),
  storage_key text NOT NULL DEFAULT 'primary',
  provisioning_state text NOT NULL DEFAULT 'ready' CHECK (provisioning_state IN ('pending','provisioning','ready','failed','disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_secrets_in_storage_key CHECK (storage_key ~ '^[a-zA-Z0-9_-]{1,80}$')
);
CREATE INDEX IF NOT EXISTS idx_tenant_storage_provider_state
  ON public.tenant_storage_registry(storage_provider, provisioning_state);

ALTER TABLE public.tenant_storage_registry ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tenant_storage_registry FROM PUBLIC;
REVOKE ALL ON public.tenant_storage_registry FROM anon, authenticated;
-- Service-role-only lookup: never expose a physical routing key to browser clients.
GRANT SELECT, INSERT, UPDATE ON public.tenant_storage_registry TO service_role;

INSERT INTO public.tenant_storage_registry(store_id,storage_tier,storage_provider,storage_key,provisioning_state)
SELECT store_id,'regular','supabase-postgres','primary','ready'
FROM public.stores
ON CONFLICT (store_id) DO NOTHING;

COMMIT;
