# GreenPlus CI #125 — Shipper E2E, Supabase DB CLI, Services REST

## Scope

Apply this patch over the GreenPlus root. It changes **only**:

- `.github/workflows/ci.yml`
- `web-shipper/playwright.config.ts`
- `scripts/ci/check-external.mjs`
- `tests/ci-pipeline.test.mjs`
- This handoff note

No package dependency changes, no migrations, no database/volume operations, no PWA service worker changes.

## Diagnosis and fix

1. **Shipper CI — `Cannot use 'import.meta' outside a module`.** Playwright loaded `web-shipper/playwright.config.ts` through the CommonJS loader on CI Node. Resolve the workspace via `__dirname`, which is provided in the CommonJS module wrapper. Keep report/test-result paths under root `artifacts/playwright/web-shipper/` and keep the CI `npm run start` web server. Do **not** set `type:module` across the whole Shipper workspace for this isolated issue.

2. **Supabase DB CI — setup-cli v1 `Unexpected HTTP response: 504`.** The action failed while obtaining the CLI, before migrations or pgTAP ran; this is not a SQL test failure. Move to official `supabase/setup-cli@v3` installer and `version: v2.stable` to avoid unintentionally adopting Supabase CLI v3's recently changed behavior. The new setup action resolves/install via npm and has a release fallback; transient dependency outages can still occur. CI continues to test only local disposable Supabase (`supabase start`, `db reset --local --no-seed`, `test db`) and never applies migrations to hosted production.

3. **Services CI — REST API 401 after Auth health passes.** The previous probe called the PostgREST OpenAPI root `/rest/v1/`, which is not a supported anonymous health check and may reject public API keys. Replace it with `GET /rest/v1/stores?select=store_id&limit=0`, requiring HTTP 200 **and a JSON array**, using only the public key. `stores` and `store_id` exist in the committed schema; requesting zero rows avoids data exposure. Legacy JWT anon keys are sent in `apikey` and `Authorization: Bearer`; new `sb_publishable_*` keys are sent only as `apikey`. HTTP 401/403 or an invalid payload still fail the gate.

## Verification

Checked against the reconstructed latest source and subsequent change-only patches:

- Root Node tests: **234 passed, 0 failed**
- Client tests: **14 passed, 0 failed**
- Shipper tests: **31 passed, 0 failed**
- `node scripts/ci/validate-ci.mjs`: **PASS**
- `.github/workflows/ci.yml` YAML parse: **PASS**
- `node --check` for modified `.mjs`: **PASS**

Not executed here: actual GitHub Actions setup-cli install, real authenticated Supabase project probe, browser Playwright E2E, full Next.js builds. Those require GitHub secrets/remote services/dependencies and CI.

## What to do after applying

Commit these files, then re-run the **CI** workflow on main. Inspect each failed job individually. The `docker-build` job is gated on all jobs; do not bypass or mark failures as warnings.

If the **Services CI REST probe still returns 401**: verify that the GitHub Actions environment named `environment` exposes `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for **the same Supabase project**. Check whether the key is current (legacy anon JWT or `sb_publishable_*`); replace revoked/wrong keys in GitHub Secrets. Never paste keys into a CI log or chat. The `/auth/v1/health` endpoint alone does not prove REST authorization. If the response instead indicates a missing `stores` table or restricted grants, inspect remote schema and policies; do not weaken RLS merely to pass CI.

If the **Supabase CLI installer** still intermittently fails: this is a dependency distribution issue, not necessarily bad migrations. A separate retry approach with capped attempts or an exact, verified v2 CLI version may help. Avoid `version: latest` during a multi-tenant database migration project.

If the **Shipper E2E** moves past config loading but fails later: use the workflow's uploaded `shipper-e2e-diagnostics` artifact to inspect traces/screenshots. That would be a separate browser test failure, not the current config error.
