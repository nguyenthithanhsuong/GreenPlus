-- MANUAL REVIEW REQUIRED: security-only, additive privilege correction.
-- Historical migration 0001 grants anon/authenticated DEFAULT EXECUTE to
-- functions created by postgres. 0016 and 0018 revoked PUBLIC but not the
-- direct role grants; no applied migration is rewritten here.
BEGIN;

REVOKE ALL ON FUNCTION public.ai_consume_quota(uuid,uuid,text,integer)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ai_decide_promotion(uuid,uuid,uuid,text,numeric)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ai_create_manual_promotion(uuid,uuid,uuid,uuid,numeric,timestamptz,timestamptz)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.ai_consume_quota(uuid,uuid,text,integer)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.ai_decide_promotion(uuid,uuid,uuid,text,numeric)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.ai_create_manual_promotion(uuid,uuid,uuid,uuid,numeric,timestamptz,timestamptz)
  TO service_role;
COMMIT;
