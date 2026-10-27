-- Apply only AFTER validating the current v2 store_members and stores schema.
-- Runs atomically with INSERT/UPDATE on stores; never runs as a manual data rebuild.
BEGIN;
CREATE OR REPLACE FUNCTION public.greenplus_sync_store_manager()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE selected_role_id uuid;
BEGIN
  SELECT u.role_id INTO selected_role_id
  FROM public.users u JOIN public.roles r ON r.role_id = u.role_id
  WHERE u.user_id = NEW.manager_id AND u.status = 'active'
    AND r.is_manager IS TRUE AND coalesce(r.is_admin,false) IS FALSE
    AND coalesce(r.is_shipper,false) IS FALSE;
  IF selected_role_id IS NULL THEN
    RAISE EXCEPTION 'Store manager must be an active Manager user';
  END IF;
  UPDATE public.users SET store_id = NEW.store_id
  WHERE user_id = NEW.manager_id AND store_id IS DISTINCT FROM NEW.store_id;
  INSERT INTO public.store_members (store_id,user_id,role_id,status)
  VALUES (NEW.store_id,NEW.manager_id,selected_role_id,'active')
  ON CONFLICT (store_id,user_id)
  DO UPDATE SET role_id=EXCLUDED.role_id,status='active';
  INSERT INTO public.store_settings (store_id)
  VALUES (NEW.store_id)
  ON CONFLICT (store_id) DO NOTHING;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.greenplus_sync_store_manager() FROM PUBLIC;
DROP TRIGGER IF EXISTS greenplus_store_manager_sync ON public.stores;
CREATE TRIGGER greenplus_store_manager_sync
AFTER INSERT OR UPDATE OF manager_id ON public.stores
FOR EACH ROW EXECUTE FUNCTION public.greenplus_sync_store_manager();
-- Keep staff memberships synchronized when Admin creates / updates staff records.
CREATE OR REPLACE FUNCTION public.greenplus_sync_staff_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $staff$
DECLARE is_internal boolean;
BEGIN
  SELECT (coalesce(is_manager,false) OR coalesce(is_employee,false) OR coalesce(is_shipper,false))
    INTO is_internal FROM public.roles WHERE role_id = NEW.role_id;
  IF coalesce(is_internal,false) IS FALSE THEN
    DELETE FROM public.store_members WHERE user_id=NEW.user_id;
    RETURN NEW;
  END IF;
  IF NEW.status <> 'active' THEN
    UPDATE public.store_members SET status='inactive' WHERE user_id=NEW.user_id;
    RETURN NEW;
  END IF;
  IF NEW.store_id IS NOT NULL AND NEW.role_id IS NOT NULL THEN
    INSERT INTO public.store_members (store_id,user_id,role_id,status)
    VALUES (NEW.store_id,NEW.user_id,NEW.role_id,'active')
    ON CONFLICT (store_id,user_id)
    DO UPDATE SET role_id=EXCLUDED.role_id,status='active';
  END IF;
  RETURN NEW;
END;
$staff$;
REVOKE ALL ON FUNCTION public.greenplus_sync_staff_membership() FROM PUBLIC;
DROP TRIGGER IF EXISTS greenplus_staff_membership_sync ON public.users;
CREATE TRIGGER greenplus_staff_membership_sync
AFTER INSERT OR UPDATE OF role_id,store_id,status ON public.users
FOR EACH ROW EXECUTE FUNCTION public.greenplus_sync_staff_membership();
COMMIT;
-- NOTE: Assigning a Manager changes users.store_id (default store).
-- Previous store ownership / memberships are retained intentionally to support multi-store management.
-- A full transfer must explicitly assign a replacement for the previous store.
