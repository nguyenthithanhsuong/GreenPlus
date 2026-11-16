BEGIN;

CREATE TABLE IF NOT EXISTS public.ai_knowledge (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 store_id uuid NOT NULL REFERENCES public.stores(store_id),
 question varchar(300) NOT NULL,
 answer text NOT NULL CHECK(char_length(answer) BETWEEN 1 AND 6000),
 enabled boolean NOT NULL DEFAULT true,
 created_by uuid REFERENCES public.users(user_id),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(store_id,question)
);
CREATE INDEX IF NOT EXISTS ai_knowledge_store_idx ON public.ai_knowledge(store_id,enabled);

CREATE TABLE IF NOT EXISTS public.ai_conversations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 store_id uuid NOT NULL REFERENCES public.stores(store_id),
 actor_id uuid NOT NULL REFERENCES public.users(user_id),
 role varchar(20) NOT NULL CHECK(role IN ('admin','manager','employee','shipper','customer')),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(store_id,id)
);
CREATE INDEX IF NOT EXISTS ai_conversations_actor_idx ON public.ai_conversations(store_id,actor_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 store_id uuid NOT NULL REFERENCES public.stores(store_id),
 conversation_id uuid NOT NULL,
 actor_id uuid NOT NULL REFERENCES public.users(user_id),
 question text NOT NULL CHECK(char_length(question) BETWEEN 2 AND 1500),
 answer text NOT NULL CHECK(char_length(answer) <= 6000),
 answer_mode varchar(50) NOT NULL,
 confidence numeric(5,4) NOT NULL DEFAULT 0 CHECK(confidence BETWEEN 0 AND 1),
 source_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
 handoff boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(store_id,conversation_id) REFERENCES public.ai_conversations(store_id,id)
);
CREATE INDEX IF NOT EXISTS ai_messages_conversation_idx ON public.ai_messages(conversation_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_forecasts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 store_id uuid NOT NULL REFERENCES public.stores(store_id),
 product_id uuid NOT NULL REFERENCES public.products(product_id),
 batch_id uuid REFERENCES public.batches(batch_id),
 available integer NOT NULL CHECK(available >= 0),
 predicted_daily_units numeric(12,3) NOT NULL DEFAULT 0 CHECK(predicted_daily_units >= 0),
 predicted_14d_units numeric(12,2) NOT NULL DEFAULT 0 CHECK(predicted_14d_units >= 0),
 predicted_stockout_date date,
 days_to_expiry integer,
 training_days integer NOT NULL CHECK(training_days >= 0),
 validation_mae numeric(12,3),
 confidence text NOT NULL CHECK(confidence IN ('low','medium','high')),
 model_version text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_forecasts_store_date_idx ON public.ai_forecasts(store_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_complaint_triage (
 complaint_id uuid PRIMARY KEY REFERENCES public.complaints(complaint_id) ON DELETE CASCADE,
 store_id uuid NOT NULL REFERENCES public.stores(store_id),
 category text NOT NULL,
 priority text NOT NULL CHECK(priority IN ('normal','medium','high')),
 confidence numeric(5,4) NOT NULL CHECK(confidence BETWEEN 0 AND 1),
 model_version text NOT NULL,
 reviewed_by uuid REFERENCES public.users(user_id),
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_complaint_triage_store_idx ON public.ai_complaint_triage(store_id,priority,created_at DESC);

CREATE TABLE IF NOT EXISTS public.support_threads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 store_id uuid NOT NULL REFERENCES public.stores(store_id),
 order_id uuid NOT NULL REFERENCES public.orders(order_id),
 customer_id uuid NOT NULL REFERENCES public.users(user_id),
 shipper_id uuid REFERENCES public.users(user_id),
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')),
 is_escalated boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(store_id,order_id),
 UNIQUE(store_id,id)
);
CREATE INDEX IF NOT EXISTS support_threads_customer_idx ON public.support_threads(customer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS support_threads_shipper_idx ON public.support_threads(shipper_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.support_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 store_id uuid NOT NULL REFERENCES public.stores(store_id),
 thread_id uuid NOT NULL,
 sender_id uuid NOT NULL REFERENCES public.users(user_id),
 sender_role text NOT NULL CHECK(sender_role IN ('admin','manager','employee','shipper','customer')),
 body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(store_id,thread_id) REFERENCES public.support_threads(store_id,id)
);
CREATE INDEX IF NOT EXISTS support_messages_thread_idx ON public.support_messages(thread_id,created_at DESC);

CREATE OR REPLACE FUNCTION public.ai_verify_thread()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.orders o WHERE o.order_id=NEW.order_id AND o.store_id=NEW.store_id AND o.user_id=NEW.customer_id) THEN
  RAISE EXCEPTION 'Support thread customer/order/store mismatch' USING ERRCODE='23514';
 END IF;
 IF NEW.shipper_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM public.deliveries d WHERE d.order_id=NEW.order_id AND d.store_id=NEW.store_id AND d.employee_id=NEW.shipper_id
 ) THEN RAISE EXCEPTION 'Shipper is not assigned to the order' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $fn$;
DROP TRIGGER IF EXISTS ai_verify_thread_trigger ON public.support_threads;
CREATE TRIGGER ai_verify_thread_trigger BEFORE INSERT OR UPDATE ON public.support_threads
FOR EACH ROW EXECUTE FUNCTION public.ai_verify_thread();

CREATE TABLE IF NOT EXISTS public.ai_usage_windows (
 store_id uuid NOT NULL REFERENCES public.stores(store_id),
 actor_id uuid NOT NULL REFERENCES public.users(user_id),
 action text NOT NULL,
 hour_bucket timestamptz NOT NULL,
 request_count integer NOT NULL DEFAULT 0 CHECK(request_count >= 0),
 PRIMARY KEY(store_id,actor_id,action,hour_bucket)
);

CREATE OR REPLACE FUNCTION public.ai_consume_quota(p_store uuid,p_actor uuid,p_action text,p_limit integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE v_used integer;
BEGIN
 IF p_store IS NULL OR p_actor IS NULL OR p_action NOT IN ('chat','recipes','forecast','promotions','triage') OR p_limit < 1 OR p_limit > 200 THEN
  RAISE EXCEPTION 'Invalid AI quota parameters';
 END IF;
 INSERT INTO public.ai_usage_windows(store_id,actor_id,action,hour_bucket,request_count)
 VALUES(p_store,p_actor,p_action,date_trunc('hour',now()),1)
 ON CONFLICT(store_id,actor_id,action,hour_bucket)
 DO UPDATE SET request_count=public.ai_usage_windows.request_count + 1
 RETURNING request_count INTO v_used;
 RETURN v_used <= p_limit;
END $fn$;

CREATE OR REPLACE FUNCTION public.ai_decide_promotion(
 p_store uuid,p_suggestion uuid,p_actor uuid,p_decision text,p_discount numeric DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE suggestion public.promotion_suggestions%ROWTYPE; role_ok boolean; actual_discount numeric;
BEGIN
 SELECT EXISTS (
  SELECT 1 FROM public.users u JOIN public.roles r ON r.role_id=u.role_id
  WHERE u.user_id=p_actor AND u.status='active' AND r.is_manager=true AND
   (EXISTS (SELECT 1 FROM public.store_members m WHERE m.user_id=p_actor AND m.store_id=p_store AND m.status='active')
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.store_id=p_store AND s.manager_id=p_actor))
 ) INTO role_ok;
 IF NOT role_ok THEN RAISE EXCEPTION 'Manager authorization required' USING ERRCODE='42501'; END IF;
 IF p_decision NOT IN ('accepted','rejected') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
 SELECT * INTO suggestion FROM public.promotion_suggestions WHERE store_id=p_store AND id=p_suggestion FOR UPDATE;
 IF NOT FOUND OR suggestion.status<>'pending' THEN RAISE EXCEPTION 'Pending suggestion not found' USING ERRCODE='23514'; END IF;
 IF suggestion.suggested_end_at<=now() THEN RAISE EXCEPTION 'Suggestion expired' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.products p WHERE p.product_id=suggestion.product_id AND p.store_id=p_store AND p.status='active') THEN
  RAISE EXCEPTION 'Suggestion product is not active in this store' USING ERRCODE='23514'; END IF;
 IF suggestion.batch_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.batches b WHERE
  b.batch_id=suggestion.batch_id AND b.product_id=suggestion.product_id AND b.store_id=p_store
  AND b.status='available' AND b.expire_date>=CURRENT_DATE) THEN
  RAISE EXCEPTION 'Suggestion batch does not belong to this store or is unavailable' USING ERRCODE='23514'; END IF;
 actual_discount := COALESCE(p_discount,suggestion.suggested_discount_pct);
 IF actual_discount <= 0 OR actual_discount > 50 THEN RAISE EXCEPTION 'Discount out of approved range'; END IF;
 UPDATE public.promotion_suggestions SET status=p_decision, decided_by=p_actor, decided_at=now()
 WHERE store_id=p_store AND id=p_suggestion;
 IF p_decision='accepted' THEN
  INSERT INTO public.promotions(store_id,scope,product_id,batch_id,discount_type,discount_value,start_at,end_at,source,suggestion_id,status,created_by)
  VALUES(p_store,CASE WHEN suggestion.batch_id IS NULL THEN 'product' ELSE 'batch' END,
   suggestion.product_id,suggestion.batch_id,'percentage',actual_discount,
   GREATEST(now(),suggestion.suggested_start_at),suggestion.suggested_end_at,
   'ai_suggestion',p_suggestion,'active',p_actor);
 END IF;
 INSERT INTO public.audit_logs(store_id,actor_id,action,entity,entity_id,before_data,after_data)
 VALUES(p_store,p_actor,'ai.promotion.'||p_decision,'promotion_suggestion',p_suggestion,
  jsonb_build_object('status','pending'),jsonb_build_object('status',p_decision,'discount',CASE WHEN p_decision='accepted' THEN actual_discount ELSE NULL END));
 RETURN jsonb_build_object('status',p_decision,'suggestion_id',p_suggestion);
END $fn$;
CREATE UNIQUE INDEX IF NOT EXISTS ai_one_pending_suggestion ON public.promotion_suggestions(store_id,product_id,COALESCE(batch_id,'00000000-0000-0000-0000-000000000000'::uuid)) WHERE status='pending';
CREATE UNIQUE INDEX IF NOT EXISTS ai_unique_promotion_suggestion ON public.promotions(suggestion_id) WHERE suggestion_id IS NOT NULL;

ALTER TABLE public.ai_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_complaint_triage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_windows ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.ai_knowledge,public.ai_conversations,public.ai_messages,public.ai_forecasts,public.ai_complaint_triage,public.support_threads,public.support_messages,public.ai_usage_windows TO service_role;
REVOKE ALL ON public.ai_knowledge,public.ai_conversations,public.ai_messages,public.ai_forecasts,public.ai_complaint_triage,public.support_threads,public.support_messages,public.ai_usage_windows FROM anon,authenticated;
REVOKE ALL ON FUNCTION public.ai_consume_quota(uuid,uuid,text,integer),public.ai_decide_promotion(uuid,uuid,uuid,text,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_consume_quota(uuid,uuid,text,integer),public.ai_decide_promotion(uuid,uuid,uuid,text,numeric) TO service_role;
COMMIT;
