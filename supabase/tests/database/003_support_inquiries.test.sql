-- Review-only checks on disposable Supabase local instance after migration 0022.
-- No user data, authentication credentials, or mutations.
create extension if not exists pgtap with schema extensions;
begin;
set local search_path=extensions,public,pg_catalog;
select plan(8);
select has_table('public','support_inquiries','General support threads exist');
select has_table('public','support_inquiry_messages','General support messages exist');
select ok((select relrowsecurity from pg_class where oid='public.support_inquiries'::regclass),'Inquiry RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.support_inquiry_messages'::regclass),'Message RLS enabled');
select ok(not has_table_privilege('anon','public.support_inquiries','SELECT'),'No anonymous inquiry read');
select ok(not has_table_privilege('authenticated','public.support_inquiry_messages','INSERT'),'No direct browser message inserts');
select ok(not has_function_privilege('anon','public.gp_consume_submission_quota(uuid,uuid,text,integer)','EXECUTE'),'Guest cannot bypass rate limiter');
select ok(has_function_privilege('service_role','public.gp_consume_submission_quota(uuid,uuid,text,integer)','EXECUTE'),'Server may atomically consume quota');
select * from finish();
rollback;
