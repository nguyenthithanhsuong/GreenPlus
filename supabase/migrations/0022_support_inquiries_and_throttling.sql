-- MANUAL REVIEW REQUIRED: new tenant-scoped live-support tables and atomic abuse protection.
-- Apply to staging and verify RLS first; never auto-migrate production.
BEGIN;

CREATE TABLE IF NOT EXISTS public.support_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(store_id),
  created_by uuid NOT NULL REFERENCES public.users(user_id),
  created_role text NOT NULL CHECK (created_role IN ('customer','shipper','employee','manager')),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 3 AND 160),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  is_escalated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id,id)
);
CREATE INDEX IF NOT EXISTS support_inquiries_store_status_idx ON public.support_inquiries(store_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS support_inquiries_owner_idx ON public.support_inquiries(store_id,created_by,created_at DESC);

CREATE TABLE IF NOT EXISTS public.support_inquiry_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  inquiry_id uuid NOT NULL,
  sender_id uuid NOT NULL REFERENCES public.users(user_id),
  sender_role text NOT NULL CHECK(sender_role IN ('admin','manager','employee','shipper','customer')),
  body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (store_id,inquiry_id) REFERENCES public.support_inquiries(store_id,id)
);
CREATE INDEX IF NOT EXISTS support_inquiry_messages_page_idx ON public.support_inquiry_messages(store_id,inquiry_id,created_at);

-- SQL RLS is an additional deny-by-default boundary. Server routes resolve JWT,
-- store membership/ownership and business permissions BEFORE using service_role.
ALTER TABLE public.support_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_inquiry_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.support_inquiries,public.support_inquiry_messages FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.support_inquiries,public.support_inquiry_messages TO service_role;

-- Reuse the existing per-store/user/hour quota ledger. Atomic increments work
-- across serverless instances; do not rely on in-memory counters on Vercel.
CREATE OR REPLACE FUNCTION public.gp_consume_submission_quota(
  p_store uuid, p_actor uuid, p_action text, p_limit integer
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE v_count integer;
BEGIN
  IF p_store IS NULL OR p_actor IS NULL OR
     p_action NOT IN ('support.message','support.inquiry','support.order-message') OR
     p_limit NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'Invalid submission quota input' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.ai_usage_windows(store_id,actor_id,action,hour_bucket,request_count)
  VALUES(p_store,p_actor,p_action,date_trunc('hour',now()),1)
  ON CONFLICT(store_id,actor_id,action,hour_bucket)
  DO UPDATE SET request_count=LEAST(p_limit+1, public.ai_usage_windows.request_count+1)
  RETURNING request_count INTO v_count;
  RETURN v_count <= p_limit;
END $fn$;
REVOKE ALL ON FUNCTION public.gp_consume_submission_quota(uuid,uuid,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gp_consume_submission_quota(uuid,uuid,text,integer) TO service_role;
COMMIT;
