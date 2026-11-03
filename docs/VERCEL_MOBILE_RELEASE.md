# GreenPlus — Vercel + Mobile release handoff

**Source baseline:** GreenPlus(3).rar, CI #117. **Scope:** deployment preparation, not a claim that mobile APKs or production Vercel deployments have been published.

## 1. Applications and ports

| App | Local `npm run dev` | Full Docker image **internal** port | Default full Docker **host** port | Vercel Root Directory |
|---|---|---|---|---|
| Web Admin | `localhost:3000` | `3001` | `3000` | `web-admin` |
| Web Client | `localhost:3001` | `3000` | `3001` | `web-client` |
| Web Shipper | `localhost:3002` | `3002` | `3002` | `web-shipper` |

The production web Docker Compose and the local Next dev servers **cannot share the same host ports at once**. `npm run dev` starts only the `docker/three-tier` database/gateway stack, then launches all three Next.js apps in interactive Turbo TUI.

On the user's Windows machine, verify root `.env` and per-workspace `.env.local` if present: values such as `NEXT_PUBLIC_WEB_ADMIN_URL` / `NEXT_PUBLIC_WEB_CLIENT_URL` should point to the *actual application* and never be swapped blindly. Neither `.env` nor private database backups belong in a commit or release ZIP.

## 2. Before deploying to Vercel

1. Create/configure **three independent Vercel projects** from the same Git repository. Framework preset: Next.js. Set Root Directory to `web-admin`, `web-client`, or `web-shipper` respectively. Verify monorepo workspace resolution and that `packages/supabase-shared` is accessible during the build (enable inclusion of files outside the Root Directory where needed/supported). Vercel's detected npm build/install commands should be checked against the workspace package scripts.
2. Use each project's **Production/Preview** environment values, not your local `.env`: public Supabase URL and anon key, plus server-only environment values needed by that application. Never put Supabase service-role keys, Shipper session secrets, Better Stack source tokens, or Sentry auth tokens in a `NEXT_PUBLIC_` variable.
3. Set trusted origins and callback URLs in Supabase Authentication for the real HTTPS Client/Admin/Shipper domains and any auth handoff flow. Avoid a redirect back to `localhost` from deployed pages.
4. Confirm all three Vercel builds have the expected app route, API routes, valid auth configuration, and do **not** silently bind to `localhost:3000`/`:3001`.
5. GitHub **CI** must pass frontend matrix, backend, Docker DB, Supabase DB, service probes and image smoke. GHCR image publication occurs only on the guarded `main` push. **Vercel's own Git auto-deploy may occur independently of CI**; if a strict pre-deploy gate is required, configure Vercel-specific deployment protection / orchestration separately. `Production Verify` checks existing deployments, it does not trigger them.
6. Confirm monitoring on all three Vercel projects (Sentry server/client DSN where applicable and Better Stack ingestion/log source). The Services CI API check establishes access/ingestion, but does not prove all app error events reach the dashboard end-to-end.

## 3. Mobile PWA: first release

Client and Shipper already include a web manifest, 192/512/maskable icons, `sw.js`, `/offline.html`, a registration/install flow, and an Android assetlinks route.

After deploying each **HTTPS** origin:

```powershell
node scripts/check-pwa-deployment.mjs https://YOUR-CLIENT-URL https://YOUR-SHIPPER-URL
```

Manually open each app on Android Chrome and use the browser install workflow, then verify launch, login, logout, installed display mode, refresh, offline fallback, and that authenticated/API data is **not** served from an offline cache. A successful HTTP probe cannot force the browser to offer "Install app"; unsupported browsers or app settings may show "Create shortcut" instead.

## 4. Android TWA: after successful HTTPS PWA deployment

Bubblewrap packages the deployed Client/Shipper web apps. It does **not** build the Flutter skeletons under `mobile/customer_app` or `mobile/shipper_app`.

```powershell
npm run mobile:client:init -- https://YOUR-CLIENT-URL/
npm run mobile:shipper:init -- https://YOUR-SHIPPER-URL/
```

After creating a signing key **outside Git**, obtain its certificate SHA-256 fingerprint and configure:

- Client Vercel runtime: `GREENPLUS_TWA_CLIENT_SHA256`
- Shipper Vercel runtime: `GREENPLUS_TWA_SHIPPER_SHA256`

The fingerprint format is a colon-separated uppercase SHA-256 (`AA:BB:...`, 32 octets). The expected Android package names in the current server-side Digital Asset Links routes are `com.greenplus.client` and `com.greenplus.shipper`. **Match these to the actual Bubblewrap generated application IDs before publishing.**

After redeploying, verify **both** `https://your-domain/.well-known/assetlinks.json` endpoints, their signing fingerprints, and:

```powershell
node scripts/mobile-twa.mjs client check https://YOUR-CLIENT-URL/
node scripts/mobile-twa.mjs shipper check https://YOUR-SHIPPER-URL/
npm run mobile:client:build
npm run mobile:shipper:build
```

Both mobile build commands require Bubblewrap/Android tooling on the host; they were **not** executed in the CI/source review environment. Testing a signed APK on a real device is still required to confirm Trusted Web Activity URL verification, credentials and correct browser fallback.

## 5. One pre-push check and rollback

Apply the ZIP to your **current source** with no resets to Docker or Supabase. Remove only the exact obsolete files named in `FILES_TO_REMOVE.txt` (provided in the release ZIP). Then run:

```powershell
npm run test:release:static
npm run lint
npm run typecheck
npm run build
```

The static command uses only Node and validates root+Shipper tests and CI contracts. Lint/typecheck/build require a working `npm ci` dependency install. On your PC, you can additionally run:

```powershell
npm run docker:three-tier:check
npm run test:three-tier-transactions:docker
npm run test:three-tier-lifecycle:docker
```

CI independently runs the disposable Supabase stack, Docker commerce and API smoke checks. Never run `supabase db reset` against production or delete local Docker volumes as a troubleshooting shortcut.

**Rollback:** revert this release commit or restore the prior versions of the changed files; the release contains no database migration and does not modify existing Docker volumes. Restore the listed legacy files from the pre-patch source only if you explicitly need them.
