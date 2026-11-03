# GreenPlus CI #117 — Source/CI stabilization release

**Baseline:** `GreenPlus(3).rar` and CI #117. Apply **once** onto that version of the repository. This is a root-relative changes-only ZIP. It does not contain `GreenPlus(2)` or any previous Phase patches.

## Changes in this release

- Fix Shipper's CI test to validate the *actual* three-app matrix, with all required Docker build gates, without depending on the obsolete exact YAML row from an older workflow.
- Retain existing Shipper production Playwright tests and actual guest API checks. No tests are disabled to make CI pass.
- Consolidate four historical CI #113–116 regression test files into the durable `tests/release-regression.test.mjs` covering migration safeguards, browser auth tests, matrix gating, image/data safety and port mapping.
- Remove unused Shipper-to-Admin authentication and delivery API adapter modules; current Shipper routes use local server-side services instead. This does **not** change the live Shipper authentication code.
- Run Shipper's API/Node tests once in the Shipper matrix rather than redundantly in both Shipper and Backend CI. Docker Build still requires both jobs.
- Align local **Admin 3000 / Client 3001 / Shipper 3002** across `dev` and `dev:turbo`. The full web Docker Compose maps these host ports without changing existing **internal image ports** (Admin 3001 / Client 3000 / Shipper 3002).
- Remove server-only Supabase service-role key from **Docker build arguments** while retaining only the required runtime secret. Block local database backups from Docker build context and add backup file patterns to `.gitignore`.
- Verify three Vercel project deployments **concurrently** for the exact CI commit SHA so independent polling cannot consume three sequential retry windows. Do not accept an older READY deployment.
- Improve Client metadata and update README plus `docs/VERCEL_MOBILE_RELEASE.md` for PWA/TWA/Vercel handoff.
- Add one local command `npm run test:release:static` for the root + Shipper Node tests and mandatory CI contract validation.

## One-time application on Windows

1. Back up or commit any existing local changes you intend to keep. **Do not copy this ZIP over another, different source revision without review.**
2. Extract this ZIP directly into your GreenPlus repository root, preserving paths.
3. Remove only the exact unused files listed in `FILES_TO_REMOVE.txt`:

```powershell
Get-Content .\FILES_TO_REMOVE.txt | Where-Object { $_.Trim() } | ForEach-Object {
    if (Test-Path -LiteralPath $_ -PathType Leaf) { Remove-Item -LiteralPath $_ -Force }
}
Remove-Item .\FILES_TO_REMOVE.txt
```

4. Verify locally:

```powershell
npm run test:release:static
npm run lint
npm run typecheck
npm run build
```

5. Review `git diff --stat`, create **one commit**, open **one PR**, and wait for the GitHub Actions matrix and database/service gates. Do not commit `.env`, private keys or database dumps. Do not run destructive database resets.

## Verification performed for this artifact

- Root Node test suite: **162 / 162 passed** after consolidating the prior short-lived regression tests.
- Shipper Node tests: **31 / 31 passed** (previous CI #117 had 30/31 due to its stale matrix assertion).
- `scripts/ci/validate-ci.mjs`: passed; Docker Build still gated by all six required jobs.
- Three GitHub workflow YAML files and full web Docker Compose: parsed successfully with a YAML parser.
- JavaScript syntax checks: pass for the changed Vercel deployment verifier.

**Not verified in this execution environment:** `npm ci` / complete Next.js lint, TypeScript and builds (npm package cache incomplete and external package downloads unavailable); actual GitHub Actions runners, disposable Supabase/Docker stacks, Vercel domains, Sentry/Better Stack credentials, Playwright browser, TWA signing and Android installation. These checks remain **required**; no pipeline bypass was added.

## Known boundaries and next milestone

- This is not a full Supabase-to-Docker production cutover. The payment simulation is not a payment gateway.
- `docker-compose.yml` for full web deployment uses the same **host** ports as development; do not run both stacks simultaneously on one host.
- Root `.env`, `docker/three-tier/.env`, `.env.local`, database backups and TWA private signing keys are **not** included in this ZIP. If backup files were previously committed, `.gitignore` alone cannot untrack them; check `git ls-files` and remove from Git tracking **only after confirming they're no longer needed in the repository**, without deleting local backups.
- `Production Verify` is a post-CI artifact/deployment verifier, not a Vercel or Coolify deployment trigger. For a strict pre-deploy gate in Vercel, configure provider-side gating rather than relying on GitHub workflows alone.
- Next milestone: actual Client/Shipper production deployment verification, PWA installation on device, and Bubblewrap TWA Digital Asset Links/signing as described in `docs/VERCEL_MOBILE_RELEASE.md`.
