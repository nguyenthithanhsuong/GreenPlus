-- Restore archived FAQ into unpublished drafts without changing the historical question key.
-- Manual-review migration: only service_role may execute after application authorization.
BEGIN;
CREATE OR REPLACE FUNCTION public.ai_knowledge_restore_drafts(
  p_store_id uuid, p_actor_id uuid, p_actor_role text, p_ids uuid[]
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE
  v_count integer;
  v_changed integer;
  v_now timestamptz := clock_timestamp();
BEGIN
  IF p_actor_role <> 'manager' OR p_actor_role IS NULL THEN
    RAISE EXCEPTION 'Only Manager can restore archived knowledge' USING ERRCODE='42501';
  END IF;
  IF p_store_id IS NULL OR p_actor_id IS NULL OR p_ids IS NULL
     OR cardinality(p_ids) < 1 OR cardinality(p_ids) > 75
     OR EXISTS (SELECT 1 FROM pg_catalog.unnest(p_ids) AS x(id) WHERE id IS NULL)
     OR (SELECT count(DISTINCT id) FROM pg_catalog.unnest(p_ids) AS x(id)) <> cardinality(p_ids)
  THEN
    RAISE EXCEPTION 'Invalid restore request' USING ERRCODE='22023';
  END IF;
  -- Independently enforce Manager identity and active membership in this tenant.
  -- The RPC remains callable only through service_role after API session checks.
  IF NOT EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON r.role_id = u.role_id
    WHERE u.user_id = p_actor_id AND u.status = 'active'
      AND lower(r.role_name) = 'manager' AND r.is_manager = true
      AND (
        EXISTS (SELECT 1 FROM public.store_members m
                WHERE m.user_id = p_actor_id AND m.store_id = p_store_id AND m.status = 'active')
        OR EXISTS (SELECT 1 FROM public.stores st
                   WHERE st.store_id = p_store_id AND st.manager_id = p_actor_id)
      )
  ) THEN
    RAISE EXCEPTION 'Manager membership required' USING ERRCODE='42501';
  END IF;
  SELECT count(*) INTO v_count FROM public.ai_knowledge k
  WHERE k.store_id = p_store_id AND k.id = ANY(p_ids) AND k.deleted_at IS NOT NULL;
  IF v_count <> cardinality(p_ids) THEN
    RAISE EXCEPTION 'Some knowledge entries are not archived in the selected store' USING ERRCODE='23514';
  END IF;
  UPDATE public.ai_knowledge SET deleted_at=NULL, enabled=false,
    review_status='draft', reviewed_by=NULL, reviewed_at=NULL, updated_at=v_now
  WHERE store_id=p_store_id AND id=ANY(p_ids) AND deleted_at IS NOT NULL;
  GET DIAGNOSTICS v_changed = ROW_COUNT;
  IF v_changed <> cardinality(p_ids) THEN
    RAISE EXCEPTION 'Concurrent knowledge restore detected' USING ERRCODE='40001';
  END IF;
  INSERT INTO public.audit_logs(store_id,actor_id,action,entity,entity_id,after_data)
  SELECT p_store_id,p_actor_id,'ai.knowledge.restore','ai_knowledge',x.id,
    pg_catalog.jsonb_build_object('action','restore','review_status','draft')
  FROM pg_catalog.unnest(p_ids) AS x(id);
  RETURN v_changed;
END $fn$;
REVOKE ALL ON FUNCTION public.ai_knowledge_restore_drafts(uuid,uuid,text,uuid[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ai_knowledge_restore_drafts(uuid,uuid,text,uuid[]) TO service_role;
COMMIT;
