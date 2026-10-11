-- Diagnostics: report incomplete store scoping without blocking legacy writes.
-- Deployment of phase A does NOT mean tenant isolation is enforced.
DO $do$
DECLARE t text; n bigint; store_count integer; missing_settings integer;
BEGIN
 SELECT count(*) INTO store_count FROM public.stores;
 IF store_count <> 1 THEN
  RAISE EXCEPTION '0006 assumed exactly one original store; current stores=%', store_count;
 END IF;
 SELECT count(*) INTO missing_settings FROM public.stores s LEFT JOIN public.store_settings ss ON ss.store_id=s.store_id WHERE ss.store_id IS NULL;
 IF missing_settings > 0 THEN RAISE EXCEPTION '% store_settings rows missing',missing_settings; END IF;
 FOREACH t IN ARRAY ARRAY['suppliers','categories','products','batches','inventory','inventory_transactions','prices','carts','cart_items','orders','order_items','payments','deliveries','reviews','complaints','subscriptions','posts','post_interactions','post_medias','group_buys','group_buy_members'] LOOP
  EXECUTE format('SELECT count(*) FROM public.%I WHERE store_id IS NULL',t) INTO n;
  IF n > 0 THEN RAISE NOTICE 'Pending backfill: % rows with NULL store_id in %', n,t; END IF;
 END LOOP;
 RAISE NOTICE 'Phase A checked. Nullable store_id and existing browser RLS remain intentionally unchanged.';
END $do$;
