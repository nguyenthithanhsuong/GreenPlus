# GreenPlus 2026-11-07 — Source audit + ZIP-safe cleanup

Baseline: `GreenPlus(4).rar` supplied by the user. This document distinguishes **source evidence**, **previous user logs**, and **checks not run here**.

## Core findings

1. **Three-tier Docker SANDBOX is working in last user logs**: shared-db/public, shared-db/pro_a, shared-db/pro_b, enterprise-a-db/public, enterprise-b-db/public all passed six commerce RPC signatures; three least-privilege PostgREST login checks passed; gateway and three REST backends reported ready; catalog auth and unauthorized-request checks passed. This is NOT a full production data plane.
2. **Admin switch is an opt-in, admin-only sandbox**, not a global Supabase/Docker database switch. Settings API uses the `greenplus_admin_storage_view` cookie, checks live gateway readiness, and provides a guarded Admin Docker view for Stores, Products, Categories, Inventory, Orders. Client and Shipper stay on Supabase; other Admin screens still use Supabase.
3. **Documentation conflict**: Đề cương Đồ án 2 calls for Database-per-Tenant + catalog DB and Flutter apps; Yêu cầu nâng cấp hệ thống, section III/UC07, explicitly selects Shared Database + Shared Schema, store_id + RLS, and NO separate database/schema provisioning per tenant. Current demo implements hybrid Regular(shared), Pro(schema), Enterprise(database). Resolve this discrepancy before treating it as the official implementation. Prefer the newer approved requirement as authoritative unless the instructor/team approves a change in writing.
4. **Missing source artifact**: `supabase/migrations/0016_atomic_shipper_delivery_completion.sql` is absent from the uploaded archive, as is the Shipper RPC completion code. The user previously received that patch. The current Shipper server still does a direct `.from("deliveries").update(...)` and relies on the `0014` trigger. Verify the deployed Git revision and `supabase_migrations.schema_migrations` on the CORRECT project before re-applying any migration. This patch deliberately does not alter the DB.
5. **Swagger exists behind feature flag**: three Next apps define `/api-docs` and `/api/openapi`; `ENABLE_API_DOCS=true` must be present in the running server environment, otherwise both return 404. About 55 Admin, 38 Client, 11 Shipper `route.ts` were found, but zero `@swagger`/`@openapi` blocks in these files; Swagger UI is not a complete API contract yet. The Docker gateway at :4100 has its own `/ready` and business endpoints, not a Swagger UI.
6. **Startup port inconsistency fixed here**: dev already used Admin=3000, Client=3001, Shipper=3002, but `prewarm-dev.mjs`, Next production `start`, Docker internal ports, Nginx and Docker image smoke checks disagreed. All normalized by this patch to 3000/3001/3002 (both internal + host default). This is a change to container INTERNAL ports; rebuild the two affected web images when updating full Docker web stack.
7. **Sensitive files in RAR**: root `.env`, per-app `.env.local`, `docker/three-tier/.env` and SQL database backup files are present. Do not share the raw RAR. The `zip:source` command below excludes these. It does not delete them from your working copy.

## Workflow cleanup and ZIP packaging

```powershell
# From the repo root
npm ci                       # npm workspaces, hoisted dependencies under root where compatible
npm run clean:preview         # dry-run: previews everything removed for ZIP
npm run clean:workspaces      # removes .next/.turbo/build caches from three apps; moves legacy Playwright reports into root/artifacts
npm run clean:zip             # also removes nested app node_modules (root node_modules untouched)
npm run zip:source            # generates root/artifacts/GreenPlus_Source_YYYY-MM-DD.zip without secrets/backups/caches
```

**Important**: `clean:zip` is for **packaging, not daily development**. Once it removes workspace-local node_modules that npm installed to resolve version differences, run `npm ci` at root before further builds. Do NOT make junctions or manually move conflicting nested node_modules into root. `.npmrc` requests npm's hoisted install strategy, but this does not guarantee zero nested workspace dependencies.

Next.js prohibits setting `distDir: '../something'` outside each Next app. Therefore `.next` remains in each app **while building/running**, and the script removes it when preparing an archive. Any attempt to permanently keep `.next` at root using symlinks/junctions can break Next standalone output, dev server, Vercel and Docker. Do not make that change. TypeScript incremental caches are now stored in `root/.cache/tsbuild/`; Playwright failures/results/reports in `root/artifacts/playwright/web-shipper/`; the CI diagnostics artifact follows that location. Turbo's workspace logs are cleaned for ZIP and root `.turbo` is cleaned on `clean:zip`. Vercel's per-app `.vercel` project links are preserved locally but EXCLUDED from `zip:source`.

## Swagger local links

Run from repo root (with the specific server process stopped when changing env):

```text
ENABLE_API_DOCS=true
```

Add to an ignored local `.env` used by your Next workspaces; restart the apps. These routes are server-side and do not require a database connection just to serve the UI, but external Swagger UI JS/CSS must be loadable:

| Server | UI | JSON |
| --- | --- | --- |
| Admin | http://localhost:3000/api-docs | http://localhost:3000/api/openapi |
| Client | http://localhost:3001/api-docs | http://localhost:3001/api/openapi |
| Shipper | http://localhost:3002/api-docs | http://localhost:3002/api/openapi |

Check response 200 and JSON `.paths` actually contains documented operations. Do not turn on publicly in production without an access policy; UI presence alone does not prove accurate OpenAPI docs. Docker gateway: http://127.0.0.1:4100/ready (LOCAL ONLY), authenticated `/stores` using a private gateway key. Never expose its key to browser JS.

## Practical next implementation batches

| Priority | Batch | What counts as done |
| --- | --- | --- |
| P0 | Reconcile 3-tier vs approved shared-schema requirement | One documented decision and updated ERD + migration/provisioning story; no claim of full equivalence until aligned |
| P0 | Reconcile missing `0016` / delivery completion | Compare deployed commit/remote migrations with source, test delivered -> completed atomically within same store on staging; no duplicate/unsafe migration push |
| P0 | Verify Admin flip in real browser | Start 3-tier, `docker:three-tier:check`, `docker:three-tier:check-admin`, restart Admin, log in Admin, flip on/off, read + modify each supported sandbox view, ensure Client/Shipper Supabase unaffected; test two stores and all available tiers |
| P1 | Real tenant backend/authorization | Server-authenticated user, membership, store-scoped policy and per-operation adapter, DB RLS, transactions and rollback, no silent provider fallback |
| P1 | Close schema/data gap | Production-like tables for categories/products/batches/inventory/prices/orders/deliveries/payments, state machine, transaction atomicity, migration and recovery plan; only then implement Client/Shipper Docker routing |
| P1 | OpenAPI contract | Add actual OpenAPI annotations/schemas/security/response contracts; verify JSON `paths` and docs authorization for all three apps |
| P1 | Align mobile deliverable | Proposal names Flutter; repository contains skeletal Flutter apps and PWA/TWA assets. Confirm supervisor acceptance of TWA or complete Flutter flows, tests, push and Android release |
| P2 | AI/loyalty/audit/2FA/real-time + operational checks | Evaluate each UC against acceptance criteria from requirements, do not mark complete from a route or placeholder page alone |

## Verification boundaries

This patch was exercised against a copy of `GreenPlus(4).rar`, without reading/modifying the user's live databases. Root Node tests, Shipper Node tests, CI contract validator, and YAML syntax checks were run. A Git branch/HEAD cannot be verified from an archive. Docker daemon, Next.js full build, Vercel endpoints and browser E2E were NOT executed here. The earlier Docker success is user-provided runtime evidence, not reproduced in this environment.
