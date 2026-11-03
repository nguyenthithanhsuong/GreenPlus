# GreenPlus — Tenant-aware data adapter, Phase 1

**Scope:** Admin-side product READ pilot and shared Product/Category CRUD transport. **Default status: OFF.**

## What changed

- `packages/tenant-routing/registry.mjs`: validate catalog row from `public.tenant_storage_registry` (`0015`), require `ready`, require exact `store_id`, and map (`provider`, `storage_key`) to a server-owned endpoint. Regular uses `public`, Pro uses a distinct schema, and Enterprise uses a separately configured database endpoint. Unknown targets **fail closed**.
- `packages/tenant-routing/postgrest-adapter.mjs`: a small provider-neutral HTTP PostgREST adapter with typed product/category operations (`list`, `find`, `insert`, `update`, `delete`). This adapter is compatible with Supabase PostgREST and with standalone PostgREST _when the PostgreSQL schema, FK relationships, privileges, and authentication have been provisioned_. It does not implement arbitrary SQL, storage/auth/realtime, or multi-table transactions.
- `web-admin/backend/core/tenant-data.ts`: server-only authentication boundary. It uses the authenticated request's `AsyncLocalStorage` `storeIds` (as populated by `withSentry`), reads the trusted registry, and resolves a configured endpoint and server-held credentials. A request cannot override the store with a body, query parameter, header hostname, schema, or database key.
- `web-admin/backend/modules/products/product-management.repository.ts`: an optional **Manager product LIST-only** pilot. Existing Supabase behavior remains the default; Admin global listings remain on the old path. Product CREATE/UPDATE/DELETE and Category business repositories have **not been rerouted**.
- No migration was added or applied. Existing `0015_tenant_storage_registry.sql` remains a preparatory migration that must be reviewed/confirmed on the target environment. No Docker container, database or production service was modified.

## Pilot configuration (development/staging ONLY)

Server-side `web-admin` environment:

```dotenv
# DO NOT set in production until schema, security, and rollbacks are verified.
GREENPLUS_TENANT_DATA_READ_PRODUCTS=false

# Only for an already-provisioned standalone PostgREST backend, not the
# existing simplified three-tier demonstration tables:
GREENPLUS_TENANT_POSTGREST_TARGETS_JSON='{"docker-postgres:pro_a":{"tier":"pro","kind":"postgrest","databaseKey":"shared","schema":"pro_a","url":"http://shared-rest:3000/"}}'
GREENPLUS_TENANT_POSTGREST_BEARER=<server-only-authenticated-postgrest-jwt>
```

The built-in `supabase-postgres:primary` target uses the existing `NEXT_PUBLIC_SUPABASE_URL` and server-only `SUPABASE_SERVICE_ROLE_KEY`, with `/rest/v1/` and schema `public`. A standalone Docker target must be explicitly configured for every key, with an authenticated PostgREST endpoint accessible **from the Admin server**, not from the browser. Configure an authenticated PostgREST role with minimum permissions and enforce data ownership at the database layer; do **not** reuse the demonstration's superuser or `web_anon` privileges for production.

**Do not enable the flag against the existing `docker/three-tier` demo.** That lab has `demo_products` or minimal `products` rows rather than the full GreenPlus `products`/`categories` schema (joined `categories(name)`, status, unit, etc.); the adapter cannot make that data compatible. The Docker gateway on `127.0.0.1:4100` also does not implement the full PostgREST CRUD contract. Registry `ready` is a business provisioning state, not a substitute for database schema parity and live verification.

## Run the scoped tests

```bash
npm run test:tenant-routing
```

Tests use Node's test runner and mocked PostgREST responses; no network, account or database is needed. They cover ownership, allowlist routing, no fallback, schema selection, CRUD method constraints, pagination validation and transport failure. These tests alone are **not** integration tests.

### Before enabling the pilot

1. Verify migration `0015` exists **and was applied** to a disposable/staging Supabase project; inspect the live registry and store memberships. Do not assume this merely because it exists in the source archive.
2. Provision a real GreenPlus-compatible products/categories schema and roles per tier in Docker or an external PostgreSQL environment, including FK constraints and per-tenant permissions/RLS. The current demo schema is insufficient.
3. Rehearse manager/session isolation for two stores per tier; reject wrong store ID, disabled tenant, missing target, failed connection, and role spoofing. Capture actual PostgREST logs and verify the server never leaks service keys.
4. Run `npm run check-all`, the new tenant tests, integration/E2E tests and a rollback test on the same code/environment; test Admin global listing separately.
5. Only then enable `GREENPLUS_TENANT_DATA_READ_PRODUCTS=true` for a controlled staging tenant. Disable to revert product LIST reads to the existing Supabase implementation. This flag is not a data migration or rollback of already-written data.

## Remaining scope

- Migrate Product mutations, Category, Inventory, Order/Checkout/Payment, Delivery, Client and Shipper repositories through the contract. Different modules need richer operations and explicit atomic transactions; never imitate an atomic order checkout with multiple independent REST calls.
- Replace the fixed demo slot allocator with a secure catalog/provisioner and tenant-specific database roles; Admin store provisioning must be idempotent and transactional or have a recovery mechanism.
- Implement real Docker tier SQL and privilege boundaries plus two-tenant cross-store integration tests. Do not expose direct PostgREST endpoints publicly or transmit service-role tokens to the browser.
- Verify the PWA, Sentry and Better Stack workstreams separately; the adapter does not address their runtime acceptance tests.

## Verification in this handoff

- Node v22.16.0: `npm run test:tenant-routing` passed (pure tests; no live DB).
- The repository-wide `node --test tests/*.test.mjs` still has 7 unrelated failures: four source-pattern assertions and three files importing TypeScript without a TS loader. It is **not** a check-all substitute.
- Full `npm run check-all` was **not rerun on this artifact**: dependency installation is unavailable in the sandbox (`registry.npmjs.org` DNS EAI_AGAIN). The previously reported successful result applies to the user's original checkout, not this patch.
- Docker integration and Vercel PWA checks: not run here; Docker daemon is unavailable.
