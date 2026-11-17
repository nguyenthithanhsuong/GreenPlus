-- Additive FAQ review lifecycle. Must be manually approved for production.
-- Existing approved FAQ remain approved, existing hidden FAQ become drafts.
BEGIN;

ALTER TABLE public.ai_knowledge
  ADD COLUMN IF NOT EXISTS review_status text,
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.users(user_id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

UPDATE public.ai_knowledge
SET review_status = CASE WHEN enabled THEN 'approved' ELSE 'draft' END
WHERE review_status IS NULL;

ALTER TABLE public.ai_knowledge
  ALTER COLUMN enabled SET DEFAULT false,
  ALTER COLUMN review_status SET DEFAULT 'draft',
  ALTER COLUMN review_status SET NOT NULL;

ALTER TABLE public.ai_knowledge
  ADD CONSTRAINT ai_knowledge_audience_valid
    CHECK (audience IN ('customer','shipper','manager','admin')),
  ADD CONSTRAINT ai_knowledge_review_status_valid
    CHECK (review_status IN ('draft','approved','rejected')),
  ADD CONSTRAINT ai_knowledge_approved_matches_enabled
    CHECK (enabled = (review_status = 'approved'));

CREATE INDEX IF NOT EXISTS ai_knowledge_review_list_idx
  ON public.ai_knowledge(store_id,review_status,updated_at DESC)
  WHERE deleted_at IS NULL;

-- Single transaction per bulk request. All IDs must belong to the same store,
-- be current, and be in an eligible review state. Partial success is refused.
CREATE OR REPLACE FUNCTION public.ai_knowledge_bulk_action(
  p_store_id uuid, p_actor_id uuid, p_actor_role text,
  p_ids uuid[], p_action text
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE
  v_count integer;
  v_changed integer;
  v_now timestamptz := clock_timestamp();
BEGIN
  IF p_actor_role NOT IN ('admin','manager') OR
     p_action NOT IN ('approve','reject','delete') THEN
    RAISE EXCEPTION 'Unauthorized knowledge action' USING ERRCODE='42501';
  END IF;
  IF p_action IN ('approve','reject') AND p_actor_role <> 'manager' THEN
    RAISE EXCEPTION 'Only Manager can approve or reject' USING ERRCODE='42501';
  END IF;
  IF p_store_id IS NULL OR p_actor_id IS NULL OR p_ids IS NULL OR
     cardinality(p_ids) < 1 OR cardinality(p_ids) > 75 OR
     EXISTS(SELECT 1 FROM pg_catalog.unnest(p_ids) AS ids(candidate) WHERE candidate IS NULL) OR
     (SELECT count(DISTINCT candidate) FROM pg_catalog.unnest(p_ids) AS ids(candidate)) <> cardinality(p_ids) THEN
    RAISE EXCEPTION 'Invalid IDs' USING ERRCODE='22023';
  END IF;

  SELECT count(*) INTO v_count FROM public.ai_knowledge k
  WHERE k.store_id = p_store_id AND k.id = ANY(p_ids)
    AND k.deleted_at IS NULL
    AND (p_actor_role = 'manager' OR k.review_status = 'draft')
    AND (p_action = 'delete' OR k.review_status = 'draft')
    AND (p_action <> 'approve' OR (
      k.answer !~* '^[[:space:]]*(CHƯA DUYỆT|MẪU[[:space:]]*-|CHƯA XÁC NHẬN)' AND
      length(trim(k.answer)) >= 25
    ));
  IF v_count <> cardinality(p_ids) THEN
    RAISE EXCEPTION 'Some FAQ are not in the selected store or cannot be changed' USING ERRCODE='23514';
  END IF;

  IF p_action = 'approve' THEN
    UPDATE public.ai_knowledge SET review_status='approved',enabled=true,
      reviewed_by=p_actor_id,reviewed_at=v_now,updated_at=v_now
    WHERE store_id=p_store_id AND id=ANY(p_ids) AND deleted_at IS NULL
      AND review_status='draft';
  ELSIF p_action = 'reject' THEN
    UPDATE public.ai_knowledge SET review_status='rejected',enabled=false,
      reviewed_by=p_actor_id,reviewed_at=v_now,updated_at=v_now
    WHERE store_id=p_store_id AND id=ANY(p_ids) AND deleted_at IS NULL
      AND review_status='draft';
  ELSE
    UPDATE public.ai_knowledge SET deleted_at=v_now,enabled=false,
      review_status='rejected',reviewed_by=p_actor_id,reviewed_at=v_now,updated_at=v_now
    WHERE store_id=p_store_id AND id=ANY(p_ids) AND deleted_at IS NULL
      AND (p_actor_role='manager' OR review_status='draft');
  END IF;
  GET DIAGNOSTICS v_changed = ROW_COUNT;
  IF v_changed <> cardinality(p_ids) THEN
    RAISE EXCEPTION 'Concurrent FAQ update detected; try again' USING ERRCODE='40001';
  END IF;

  INSERT INTO public.audit_logs(store_id,actor_id,action,entity,entity_id,after_data)
  SELECT p_store_id,p_actor_id,'ai.knowledge.' || p_action,'ai_knowledge',
         candidate,pg_catalog.jsonb_build_object('action',p_action,'count',cardinality(p_ids))
  FROM pg_catalog.unnest(p_ids) AS ids(candidate);
  RETURN v_changed;
END $fn$;

REVOKE ALL ON FUNCTION public.ai_knowledge_bulk_action(uuid,uuid,text,uuid[],text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ai_knowledge_bulk_action(uuid,uuid,text,uuid[],text) TO service_role;
COMMIT;
