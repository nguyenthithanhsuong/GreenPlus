# GreenPlus Docker three-tier Commerce Slice — Phase 2

**Status:** Source patch complete; no Docker/SQL execution performed in the assistant environment. `2026-11-01`.

## Scope

- Add idempotent Docker-only SQL `002` to `shared`, `enterprise-a`, `enterprise-b` init directories.
- Keep the existing admin-only tenant demo routes and demo seed tables intact.
- Align the minimum `products`/`categories` columns and per-store Category FK relationship with the Phase 1 adapter (`categories(name)` PostgREST embedding).
- Ensure a Product cannot reference another tenant's Category through `(store_id, category_id)` composite FK.
- Supply an optional rollback-only live PostgreSQL probe and static Node tests.
- Capture Shipper React render errors via Sentry `global-error.tsx` (the previous build logged a missing handler).

## Exclusions and safety

- No modifications to `supabase/migrations` and no automatic remote migration, credentials or tenant provisioning.
- No conversion of orders, payments, inventory, Shipper delivery writes, or client data paths; cross-table business transactions are not implemented.
- No production Docker adapter enablement. SQL `002` is **schema groundwork**, not complete schema parity with production.
- No JWT-based DB permissions, per-tenant DB roles, RLS, distributed provisioning, or backfill. The demo's `web_anon` privileges are not sufficient for production tenant isolation.
- The adapter's `GREENPLUS_TENANT_DATA_READ_PRODUCTS` flag **must remain false**; the default path remains Supabase.

## Validation

1. `npm run test:tenant-routing` (previous Phase 1 unit tests).
2. `npm run test:three-tier-commerce` (static SQL schema and Sentry checks).
3. Existing volumes: back up first, apply the three `002` scripts using the instructions in `docker/three-tier/README.md` and refresh PostgREST schema caches; fresh volumes apply scripts automatically on initialization.
4. With the Docker demo running, run `npm run test:three-tier-commerce:docker`. This rolls back all test inserts and probes Category cross-store FK constraints in each public/Pro schema and each Enterprise database.
5. Run `npm run check-all` locally on this merged source; verify Sentry delivery using a controlled staging exception.
6. Verify database-level row isolation and authenticated PostgREST credentials in a separate phase before considering a staging adapter cutover.

## Limitations

The Docker SQL probe tests Postgres schema mechanics, not authenticated HTTP PostgREST access; it does not validate JWT issuance, store-membership logic, catalog/provisioner readiness, or cross-database privilege separation. SQL `002` keeps the demo `price` column for legacy endpoints but the GreenPlus production price/inventory architecture is richer.
