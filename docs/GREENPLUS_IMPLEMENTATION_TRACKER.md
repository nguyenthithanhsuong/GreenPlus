# GreenPlus implementation tracker

**Updated:** 2026-11-01 (Asia/Ho_Chi_Minh)  
**Working baseline:** User reports `npm run check-all` passes. This is a user-reported local result, not an independently rerun CI result.  
**Inspected baseline:** `GreenPlus(1).rar` (uploaded in this continuation), 1,743 archive entries. Relevant project source, migrations, CI and Docker demo were inspected. Source is an archive snapshot, not a Git checkout; commit/branch and current deployment cannot be inferred.  
**Current implementation handoff:** Phase 2 changes-only package following `GreenPlus_Tenant_Adapter_Phase1_ChangesOnly_2026-11-01.zip`. Phase 1: 30 Node unit tests passed. Phase 2: Docker commerce-schema groundwork and Shipper Sentry global error boundary; no database connected.

## Architecture decisions (preserve)

- **Supabase remains the production default** until a controlled cutover; Docker PostgreSQL must coexist behind adapters, not replace the production path prematurely.
- **Regular:** shared database/shared schema, tenant rows identified by server-authenticated `store_id`.
- **Pro:** separate PostgreSQL schema per tenant.
- **Enterprise:** separate PostgreSQL database per tenant.
- A trusted tenant registry/catalog maps stores to tenancy tier and connection target. The client must never choose database/schema identifiers.
- Preserve existing authentication, authorization, and business behavior during gradual data-layer migration; avoid changing public contracts unless a coordinated versioned change is required.
- `0015_tenant_storage_registry.sql` is **not verified applied**. Do not auto-apply it to production.
- Keep Docker-based storage disabled in Vercel/production until runtime integration, migration and rollback validation pass.
- Output code changes in a changes-only ZIP that preserves repository-root-relative paths; do not reintroduce single-use cleanup scripts.

## Status legend

- **PASS (user):** local command reported passing, no independent output examined in this session.
- **Delivered previously:** prior artifact contained an implementation; merge/runtime status not re-verified.
- **Open:** unfinished or missing acceptance evidence.
- **Partial:** code is delivered for one slice, with broader business migration or end-to-end verification outstanding.
- **Needs live validation:** static code/tests alone cannot prove this behavior.

## Workstream tracker

| ID | Priority | Workstream | Status | Acceptance criterion |
| --- | --- | --- | --- | --- |
| GP-00 | P0 | Existing quality gate | PASS (user) | `npm run check-all` succeeds on current local checkout; capture commit SHA and command output at next handoff. |
| GP-01 | P0 | Audit current merged source | **Done — archive snapshot inspected** | Inspect actual workspace files; make a migration inventory of Supabase data queries/mutations, current adapters, 0015, web-admin provisioning and PWA/monitoring files. Do not assume earlier ZIP was applied. |
| GP-02 | P0 | Shared tenant context and storage router | **Partial — fail-closed resolver delivered** | All server-side data access derives tenant from authorized identity; a trusted catalog resolves `regular`/`pro`/`enterprise`; invalid/missing/disabled routing **fails closed** with no fallback to another store. No user-controlled SQL identifiers. |
| GP-03 | P0 | Database adapter and repository contracts | **Partial — Product/Category PostgREST contract delivered** | Repository operations use one typed interface, implemented by hosted Supabase and Docker PostgreSQL; work independently of UI; error, null, pagination and transaction behavior is defined and tested. Preserve Supabase as the default. |
| GP-04 | P0 | Migrate real business reads/writes | **Pilot — manager Product LIST behind default-off flag; Docker Product/Category schema groundwork added** | Inventory, products, categories, orders, order items, delivery and related ownership-sensitive modules use the adapter consistently; no hidden Supabase-only data path for Docker mode; preserve store isolation and existing API responses. |
| GP-05 | P0 | Tenant isolation/security tests | **Unit/static tests pass; live tests open** | Regular: cross-store access denied (RLS/store predicates). Pro: schema escape denied. Enterprise: DB/connection escape denied. Unauthorized requests never select a tenant via request body/query/header. Connection failures do not silently fall back. |
| GP-06 | P1 | Schema `0015` and migration plan | Delivered previously; NOT applied/verified | Compare all migration versions; run dry-run on disposable database; idempotency/backfill/rollback plan; avoid dropping existing Supabase data; get explicit approval for any production migration. |
| GP-07 | P1 | Three-tier Docker infrastructure | Delivered previously; needs live validation | Regular, Pro and Enterprise can be provisioned in isolated Docker demo with reproducible env/config and safe secrets handling; cross-tenant tests pass. No need to create hosted Supabase projects per tenant. |
| GP-08 | P1 | Admin: create and provision store by tier | Delivered groundwork; completion open | Admin-only server action creates catalog entry and correct tier target; idempotent retry, provisioning state, error handling and rollback/recovery; store cannot be used before ready; credentials never exposed to browser. |
| GP-09 | P1 | PWA client + shipper installability | Delivered previously; needs live validation | Production HTTPS deployment has valid manifest, icons, service worker/scope, install entry point; test `Install app` eligibility on supported browser/device and offline/upgrade behavior. Chrome `Create shortcut` alone is not proof of installability. |
| GP-10 | P2 | Shipper Better Stack + Sentry | Delivered previously; needs live validation | Confirm monitoring initialize on Shipper runtime, sample exceptions/requests arrive with correct environment, sensitive data are redacted, and failures do not break primary flow. |
| GP-11 | P2 | Data consistency and transactional behavior | Open | Multi-table order/inventory/fulfillment writes are atomic or explicitly compensated; no mixed-tenant transactions; concurrency/race tests cover retries and duplicate requests. |
| GP-12 | P2 | Production readiness & cutover | Open | Verify staging with Docker; production continues Supabase by default; deploy plan, backup and restore drill, per-tier metrics, config switches, regression/smoke suite, documented rollback. |
| GP-13 | P3 | Cleanup and documentation | Partly delivered previously; final cleanup open | Remove only conclusively unused scripts/files after checking imports, package scripts, CI, Docker and migrations. Never remove migration history just because a file appears unused. Update README and `.env.example` without secrets. |

## Verified archive inventory and new Phase 1 work

- Server-side direct `.from(...)` usage observed in **47 Admin source files**, **29 Client source files** and **4 Shipper source files** (file-level lexical count, not individual operations). These require an operation-by-operation inventory before safe cutover.
- Existing `docker/three-tier` has only a restricted *demonstration schema*, gateway and two preallocated Pro/Enterprise slots; it is **not** schema-compatible with production products/categories/orders.
- `supabase/migrations/0015_tenant_storage_registry.sql` exists but is not verified remotely applied. Existing `web-admin` tenant logic uses `withSentry`/`AsyncLocalStorage`, plus transport-level Supabase row filters; the new resolver leverages that authenticated scope.
- Delivered `packages/tenant-routing/registry.mjs` + `.d.mts`: validate matching store, tier/provider/key, `ready` state and server-only target map. Never fall back to other tenant/database.
- Delivered `packages/tenant-routing/postgrest-adapter.mjs` + `.d.mts`: Provider-neutral fixed-table CRUD for Products/Categories (not order transactions). Inserts force `store_id`; reads and mutations scope by store and reject cross-store results.
- Delivered `web-admin/backend/core/tenant-data.ts`: server-side registry lookup and credential selection; no trust in client-supplied DB routes.
- A **default-disabled** manager-only Product LIST pilot is wired into the real Product repository using `GREENPLUS_TENANT_DATA_READ_PRODUCTS=true`. It retains old behavior when false. Do not enable against the toy Docker schema; there is no automatic Supabase-to-Docker business data migration.
- `npm run test:tenant-routing` ran **30/30 passing tests** on Node 22.16.0. The broader ad hoc `node --test tests/*.test.mjs` had seven unrelated failures (source-pattern regression assertions and missing TS runtime loader); do not label it green. The user-reported `npm run check-all` predates this patch and could not be rerun here (npm registry DNS unavailable, no installed dependencies).
- Docker daemon unavailable in this environment. No migrations, online tests, app deployments or data writes were made. Root `.env`, database backups, node_modules and cache/build artifacts were excluded from the output.

## Implementation sequence

1. **Current milestone GP-01 and Phase 1 GP-02/03:** source inspected; provider-neutral Product/Category transport and fail-closed route resolver implemented and unit-tested. Next inspect operation contracts for remaining business modules and close database parity gap.
2. **Complete GP-02 / GP-03:** add cross-tier authorization checks and real Docker-compatible Product/Category schema; verify the live provider contract in staging, expand the opt-in product slice from LIST to remaining operations without changing existing API responses.
3. **Complete GP-04 / GP-05 / GP-11:** migrate data paths in small batches and run cross-tenant security, transactional and concurrency tests for each batch.
4. **Finish GP-06 / GP-07 / GP-08:** validate migration and provisioning on isolated Docker DBs. Preserve Supabase default until formally ready. Only enable a tier after a ready/healthy state.
5. **Verify GP-09 / GP-10:** run browser/device PWA install tests and live monitoring smoke tests.
6. **Release gates GP-12 / GP-13:** repeat `check-all`, builds, E2E, security and Docker integration; package root-relative changes only, with updated tracker and deployment/rollback steps.

## Three-tier acceptance matrix

| Test case | Regular (shared schema) | Pro (separate schema) | Enterprise (separate DB) |
| --- | --- | --- | --- |
| Valid store operations | Only rows for authenticated store | Only authenticated store's schema | Only authenticated store's database |
| Cross-tenant read/write | Denied by RLS and scoped queries | Denied by schema mapping/permissions | Denied by DB credentials/connection resolution |
| Tenant request spoofing | Rejected | Rejected | Rejected |
| Missing catalog mapping | Fail closed | Fail closed | Fail closed |
| DB outage / pool exhaustion | Explicit error, no fallback | Explicit error, no fallback | Explicit error, no fallback |
| Provisioning retry | Idempotent | Idempotent schema creation/upgrade | Idempotent database creation/upgrade |
| Integration test | Real PostgreSQL | Real PostgreSQL with at least two tenant schemas | Real PostgreSQL with at least two tenant DBs |

## 2026-11-01 Phase 2 continuation after user build log

- User-provided log showed `npm run lint-fix`, `npm run typecheck`, and `npm run build` completing: Admin 62 lint warnings, Client 60, Shipper 1; **0 lint errors**, all three TypeScript checks and production builds passed. The log **does not show tests**. `check-all` as currently defined does not include the Node test scripts and modifies files via Prettier and ESLint `--fix`.
- Build warnings: Admin/Client deprecated `sentry.client.config.ts`; Shipper missing Sentry global error boundary. Shipper global error handler has now been added. Admin/Client deprecation cleanup is still open.
- Added Docker-only `002_product_category_slice.sql` for the shared DB and both Enterprise DBs. Regular uses `public.products/categories`; Pro uses `pro_a`/`pro_b` tables; Enterprise uses its own DB. It adds Category foreign keys using `(store_id, category_id)`, and does not remove the legacy demo tables/price column.
- Added `npm run test:three-tier-commerce` (static) and `npm run test:three-tier-commerce:docker` (optional live disposable SQL validation). No SQL applied in this environment; RLS and authenticated PostgREST isolation still **not proven**. Default Supabase and pilot flag unchanged.

## Next implementation prerequisite

Apply the root-relative changes-only ZIP to a **version-controlled copy** of the current repository. Preserve `.env` and production Supabase settings. Locally run `npm run test:tenant-routing` and `npm run check-all` after install; verify unit and runtime tests separately. Do not enable the new flag until migration 0015 status, tenant schema parity, database privileges and Docker integration pass in an isolated environment.

Next deliverable should focus on **GP-04 / GP-05**: after SQL 002 groundwork, test Docker migrations in disposable volumes, implement authenticated PostgREST roles/RLS and a trusted tenant catalog, and verify two tenants per tier. Then complete production schema parity and staging integration before considering the pilot; SQL 002 alone must not enable it. Do not implement business transactions by chaining independent PostgREST requests.

## Change log

| Date | Change | Evidence |
| --- | --- | --- |
| 2026-11-01 | Prior 42-file upgrade package delivered: Admin type, Shipper Next alignment, PWA installation, 3-tier Docker foundation, Admin provisioning groundwork, migration 0015, Sentry/Better Stack, 7 one-time-script removals. | Prior assistant handoff; not independently re-inspected in current source. |
| 2026-11-01 | User reports `npm run check-all` passed. | User report; test log not attached. |
| 2026-11-01 | Explicitly tracked production adapter reroute, security, integration and deployment gaps. | This tracker. |
| 2026-11-01 | Inspected newly uploaded RAR; implemented server-only tenant registry resolver, typed PostgREST Product/Category adapter, default-off Manager Product LIST pilot, docs and tests. | 30/30 scoped Node tests pass. Build/integration tests not independently available. |
| 2026-11-01 | User validation log inspected; three production builds/typechecks passed, 123 ESLint warnings. Prepared Docker commerce slice SQL 002, rollback-only live test and Shipper Sentry global boundary. | Static Node checks pass; Docker probe, full checks and production verification pending. |
