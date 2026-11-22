-- GreenPlus Data Security Contract. Disposable LOCAL Supabase only.
-- Read-only metadata; NEVER insert or update production orders/users.
create extension if not exists pgtap with schema extensions;
begin;
set local search_path = extensions, public, pg_catalog;
select plan(5);
with tenant_tables(name) as (
 values ('suppliers'),('categories'),('products'),('batches'),('inventory'),
 ('inventory_transactions'),('prices'),('carts'),('cart_items'),('orders'),
 ('order_items'),('payments'),('deliveries'),('reviews'),('complaints'),
 ('subscriptions'),('posts'),('post_interactions'),('post_medias')
)
select ok((
  select count(*) from tenant_tables t join information_schema.columns c
    on c.table_schema='public' and c.table_name=t.name and c.column_name='store_id'
)=19,'Every core tenant business table carries store_id');
with tenant_tables(name) as (
 values ('suppliers'),('categories'),('products'),('batches'),('inventory'),
 ('inventory_transactions'),('prices'),('carts'),('cart_items'),('orders'),
 ('order_items'),('payments'),('deliveries'),('reviews'),('complaints'),
 ('subscriptions'),('posts'),('post_interactions'),('post_medias')
)
select ok((
 select count(*) from tenant_tables t join pg_class p on p.oid=to_regclass('public.'||t.name)
 where p.relrowsecurity
)=19,'RLS is enabled on all 19 core tenant business tables');
select ok((
  select count(*) from pg_class p
  where p.oid=any(array[
    'public.ai_knowledge'::regclass,'public.ai_conversations'::regclass,
    'public.ai_messages'::regclass,'public.support_threads'::regclass,
    'public.support_messages'::regclass
  ]) and p.relrowsecurity
)=5,'AI and support tables all have RLS enabled');
select ok(not has_function_privilege('anon','public.ai_consume_quota(uuid,uuid,text,integer)','EXECUTE'),
 'Guests cannot consume AI quota using the privileged RPC');
select ok(has_function_privilege('service_role','public.ai_consume_quota(uuid,uuid,text,integer)','EXECUTE'),
 'Quota RPC remains available to trusted server role');
select * from finish();
rollback;
