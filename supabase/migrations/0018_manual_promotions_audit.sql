BEGIN;
CREATE OR REPLACE FUNCTION public.ai_create_manual_promotion(
 p_store uuid,p_actor uuid,p_product uuid,p_batch uuid,p_discount numeric,p_start timestamptz,p_end timestamptz
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE permitted boolean; created uuid;
BEGIN
 SELECT EXISTS (
  SELECT 1 FROM public.users u JOIN public.roles r ON r.role_id=u.role_id
  WHERE u.user_id=p_actor AND u.status='active' AND r.is_manager=true
   AND (EXISTS(SELECT 1 FROM public.store_members m WHERE m.user_id=p_actor AND m.store_id=p_store AND m.status='active')
    OR EXISTS(SELECT 1 FROM public.stores s WHERE s.store_id=p_store AND s.manager_id=p_actor))
 ) INTO permitted;
 IF NOT permitted THEN RAISE EXCEPTION 'Only an active Manager may create a promotion' USING ERRCODE='42501'; END IF;
 IF p_discount IS NULL OR p_discount<1 OR p_discount>50 OR p_start IS NULL OR p_end IS NULL OR
    p_end<=p_start OR p_end>now()+interval '60 days' OR p_start<now()-interval '1 day' THEN
  RAISE EXCEPTION 'Invalid promotion discount or dates' USING ERRCODE='22023';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.products WHERE store_id=p_store AND product_id=p_product AND status='active') THEN
  RAISE EXCEPTION 'Product is not active in this store' USING ERRCODE='23514'; END IF;
 IF p_batch IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.batches
  WHERE store_id=p_store AND batch_id=p_batch AND product_id=p_product AND status='available' AND expire_date>=CURRENT_DATE) THEN
  RAISE EXCEPTION 'Batch unavailable in this store' USING ERRCODE='23514'; END IF;
 INSERT INTO public.promotions(store_id,scope,product_id,batch_id,discount_type,discount_value,
   start_at,end_at,source,status,created_by)
 VALUES(p_store,CASE WHEN p_batch IS NULL THEN 'product' ELSE 'batch' END,p_product,p_batch,
   'percentage',p_discount,p_start,p_end,'manual','active',p_actor)
 RETURNING id INTO created;
 INSERT INTO public.audit_logs(store_id,actor_id,action,entity,entity_id,before_data,after_data)
 VALUES(p_store,p_actor,'ai.promotion.manual_created','promotion',created,NULL,
  jsonb_build_object('product_id',p_product,'batch_id',p_batch,'percentage',p_discount,'start_at',p_start,'end_at',p_end));
 RETURN jsonb_build_object('id',created,'status','active');
END $fn$;
REVOKE ALL ON FUNCTION public.ai_create_manual_promotion(uuid,uuid,uuid,uuid,numeric,timestamptz,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_create_manual_promotion(uuid,uuid,uuid,uuid,numeric,timestamptz,timestamptz) TO service_role;
COMMIT;
