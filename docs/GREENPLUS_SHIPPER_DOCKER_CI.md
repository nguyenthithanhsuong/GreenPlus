# GreenPlus — Web Shipper Docker & CI

This is a **changes-only** patch on top of the GreenPlus Web Shipper source supplied on 27 Oct 2026.

## What changed

- `shipper-ci` now runs all Node tests before Next.js build, on Node 22.
- `docker-build` depends on all three app CI jobs (`frontend-ci`, `backend-ci`, `shipper-ci`).
- On **every** branch/PR, CI builds the Shipper container and runs a localhost smoke test.
- The container smoke test checks:
  - `GET /api/health` => 200, without a database call.
  - `GET /api/auth/me` without a cookie => 401.
  - `GET /api/shipper/deliveries` without a cookie => 401.
- On pushes to `main`, after successful checks, CI publishes the **Shipper** image to GHCR using metadata tags. Registry login is skipped on PRs.
- Shipper's multi-stage Dockerfile uses Next.js standalone output, a non-root runtime user, Node 22, an HTTP health check, and only traced runtime files (not the whole monorepo).
- `next.config.ts` traces from the monorepo root, required for the shared `packages/location` module.

`deploy-staging.yml` and `deploy-prod.yml` already have Web Shipper image build/push steps. This patch intentionally does not modify them. Their deployment and smoke-test commands are placeholders; **building/pushing an image is not the same as deploying it**.

## Runtime environment / secrets

Keep the single `GreenPlus/.env` file on your computer. Docker Compose reads it and passes only the needed keys into Shipper:

- `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `SHIPPER_SESSION_SECRET` (at least 32 UTF-8 bytes)

The Shipper Docker build does **not** accept the service-role key or session secret as `ARG`, and does not copy the root `.env`. CI smoke tests use synthetic placeholder values and must not connect to production Supabase.

For deployment outside Docker Compose, set the environment variables in your runtime platform's secret manager. Do not put them into Dockerfiles, build args, Git or `NEXT_PUBLIC_*` except for the public Supabase URL.

## Local verification — PowerShell, project root

```powershell
npm ci
npm run lint -w web-shipper
npm run typecheck -w web-shipper
npm test -w web-shipper
npm run build -w web-shipper
```

If you have Docker Desktop, stop `npm run dev:shipper` first so port 3002 is free:

```powershell
docker compose --env-file .env up --build web-shipper
```

In a second PowerShell terminal:

```powershell
Invoke-RestMethod http://localhost:3002/api/health
try { Invoke-WebRequest http://localhost:3002/api/auth/me } catch { $_.Exception.Response.StatusCode.value__ }
try { Invoke-WebRequest http://localhost:3002/api/shipper/deliveries } catch { $_.Exception.Response.StatusCode.value__ }
```

Expected results are `status = ok` and HTTP 401 / 401 for unauthenticated requests.

To stop without removing persistent app data:

```powershell
docker compose stop web-shipper
```

## CI execution / release

1. Open a pull request. Check that `shipper-ci` and the Shipper Docker smoke portion of `docker-build` succeed; no GHCR publishing occurs from the PR.
2. Merge/push to `main` only after all CI jobs pass. The `docker-build` job will publish image tags for Web Client, Web Admin, and Web Shipper.
3. Configure the **actual deployment** step separately for your hosting platform (e.g., Coolify). Existing deploy workflows currently contain TODO placeholders.
4. After deployment, test health over HTTPS and test a real Shipper login and assigned-order access using a test account. The CI smoke test is intentionally limited to unauthenticated behavior; it cannot verify Supabase credentials or database tenant isolation.

## Known limitations / security findings

- Actual Docker build and running-container smoke checks must be executed on a machine/GitHub runner with Docker; static Node tests cannot replace these checks.
- The older **Web Client/Admin** Dockerfiles currently accept `SUPABASE_SERVICE_ROLE_KEY` and `SENTRY_AUTH_TOKEN` as Docker build args, which is unsafe for confidential credentials. This Shipper-only patch does not change their build behavior to avoid unrelated deployment regressions. Plan a follow-up to move those build-time secrets to BuildKit secrets or runtime-only environment variables.
- Build tests do not automatically verify Sentry or Better Stack integration for Web Shipper; those integrations are not added by this patch.
- `GET /api/health` is **liveness**, not database readiness. It deliberately avoids leaking deployment configuration or querying Supabase.
