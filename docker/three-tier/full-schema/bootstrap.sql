-- PostgreSQL 17 compatibility bootstrap for GreenPlus's application DDL only.
-- Do not expose these roles/schemas via PostgREST before full auth/RLS review.
-- This is intentionally NOT a mock Supabase Auth/Storage/Realtime API.
BEGIN;
DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN NOINHERIT; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN NOINHERIT; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS; END IF;
END $roles$;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS realtime;
CREATE SCHEMA IF NOT EXISTS vault;
-- Application baseline calls extensions.uuid_generate_v4(). pg_catalog's UUID
-- generator is equivalent for the application's UUID PK defaults.
CREATE OR REPLACE FUNCTION extensions.uuid_generate_v4()
RETURNS uuid LANGUAGE sql VOLATILE AS 'SELECT pg_catalog.gen_random_uuid()';
-- No authenticated client connects to these database containers. Returning NULL
-- deliberately prevents a fabricated JWT identity from authorizing RLS policies.
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid LANGUAGE sql STABLE AS 'SELECT NULL::uuid';
-- DDL-only compatibility. Database triggers can call this, but the function
-- does NOT publish to Supabase Realtime. Wire a real realtime service separately.
CREATE OR REPLACE FUNCTION realtime.broadcast_changes(text,text,text,text,text,record,record)
RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN; END; $$;
REVOKE ALL ON SCHEMA auth, realtime, vault FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA auth, realtime FROM PUBLIC;
COMMIT;
