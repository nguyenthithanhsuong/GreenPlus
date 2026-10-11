-- GreenPlus custom gpc1 sessions are not Supabase Auth JWTs.
-- DO NOT grant broad anon/authenticated access to private tenant configuration.
-- DO NOT alter existing RLS policies here: the browser client may depend on them.
BEGIN;
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.store_members FROM anon, authenticated;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.store_settings FROM anon, authenticated;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.platform_admins FROM anon, authenticated;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.audit_logs FROM anon, authenticated;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_devices FROM anon, authenticated;
COMMIT;
