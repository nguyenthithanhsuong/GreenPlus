-- Test against a DISPOSABLE LOCAL Supabase database only.
create extension if not exists pgtap with schema extensions;
begin;
set local search_path = extensions, public, pg_catalog;
select plan(8);
select ok((select relrowsecurity from pg_class where oid='public.stores'::regclass),'stores RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.products'::regclass),'products RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.inventory'::regclass),'inventory RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.orders'::regclass),'orders RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.payments'::regclass),'payments RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.store_members'::regclass),'store_members RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.tenant_storage_registry'::regclass),'tenant registry RLS enabled');
select ok(not has_table_privilege('authenticated','public.tenant_storage_registry','SELECT'), 'authenticated cannot read storage registry');
select * from finish();
rollback;
