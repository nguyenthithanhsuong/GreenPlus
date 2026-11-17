# GreenPlus

A Full-Stack Smart E-Grocery Platform for Organic Produce, with three web applications: Web Admin, Web Client, and Web Shipper. Frontend built with Next.js, Tailwind CSS, Zustand, and TanStack Query. Backend powered by Supabase (PostgreSQL · Auth · Realtime · Storage). DevOps via Docker, Nginx, and GitHub Actions · Monitoring via Sentry + BetterStack.

[![CI](https://github.com/nguyenthithanhsuong/GreenPlus/actions/workflows/ci.yml/badge.svg)](https://github.com/nguyenthithanhsuong/GreenPlus/actions/workflows/ci.yml)

[![Deploy to Staging](https://github.com/nguyenthithanhsuong/GreenPlus/actions/workflows/deploy-staging.yml/badge.svg)](https://github.com/nguyenthithanhsuong/GreenPlus/actions/workflows/deploy-staging.yml)

[![Deploy to Production](https://github.com/nguyenthithanhsuong/GreenPlus/actions/workflows/deploy-prod.yml/badge.svg)](https://github.com/nguyenthithanhsuong/GreenPlus/actions/workflows/deploy-prod.yml)

## Technology Stack

| Layer                | Technology                           |
| -------------------- | ------------------------------------ |
| **Framework**        | Next.js 16, React 19, TypeScript     |
| **Styling**          | Tailwind CSS                         |
| **State**            | Zustand, TanStack Query v5           |
| **API**              | Next.js App Router, REST             |
| **Authentication**   | Supabase Auth (JWT)                  |
| **Database**         | Supabase PostgreSQL + RLS            |
| **Realtime**         | Supabase Realtime (postgres_changes) |
| **Storage**          | Supabase Storage (signed uploads)    |
| **Gateway**          | Nginx with path-based routing        |
| **Containerization** | Docker, Docker Compose               |
| **Monorepo**         | Turborepo                            |
| **CI/CD**            | GitHub Actions                       |
| **Error Tracking**   | Sentry                               |
| **Observability**    | Sentry, Better Stack, GitHub Actions |

###

npx supabase migration new <ten_thay_doi> # tạo file SQL rỗng, bạn viết SQL vào
npx supabase db reset # test lại trên local
npx supabase db push --dry-run # xem sẽ áp dụng gì lên cloud
npx supabase db push # áp dụng thật
npx supabase migration list # đối chiếu local và remote

### Local Development

```bash
# Install dependencies
npm install

# Update/verify local Docker (all 3 DB tiers), perform read-only Supabase checks,
# then start Admin, Client and Shipper (interactive Turbo UI).
npm run dev:all
# npm run dev does exactly the same.

# Only web apps; no Docker reconciliation or database changes:
npm run web
# Read-only Supabase migration + Storage checks without starting Docker:
node scripts/ci/dev-supabase-compatibility.mjs
# Remote Supabase version status (requires linked project + Supabase CLI):
npm run supabase:migrations:status
# For optional HTTP route prewarming, use a second terminal: node scripts/prewarm-dev.mjs
# Or start individual apps
npm run dev:client   # Port 3001
npm run dev:admin    # Port 3000
npm run dev:shipper  # Port 3002

# Check code quality
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm run build       # Full production build
```

## Project Structure

```
GreenPlus/
├── web-client/          # Customer-facing app (dev Port 3001)
├── web-admin/           # Admin dashboard (dev Port 3000)
├── web-shipper/         # Shipper app (Port 3002)
├── packages/supabase-shared/ # Shared utilities
├── nginx/               # Gateway reverse proxy
├── .github/workflows/   # CI/CD pipelines
├── docker-compose.yml   # Local deployment
└── README.md
```

### Safe local development / compatibility

`npm run dev:all` checks local Supabase migration hashes and Storage configuration, then attempts a **read-only** remote Supabase migration report when a project has been linked and the Supabase CLI is available. It reconciles the Docker three-tier lab (legacy sandbox SQL 002–005 plus canonical SQL 0001–0019 in three separate PostgreSQL 17 containers), verifies database changes and tenant registry, reports schema parity, and starts all three web apps. It never runs `supabase db push`, resets Docker volumes or upgrades PostgreSQL major versions.

The remote check prints **NOT VERIFIED** if there is no local Supabase link/CLI. To require an up-to-date linked remote, set `GREENPLUS_DEV_SUPABASE_REMOTE_CHECK=required`. To run only local static checks, set it to `off`. To skip Docker rebuilding/migration and verify existing containers only, set `GREENPLUS_DEV_DOCKER_UPDATE=false`. Full parity is currently **NOT CERTIFIED**: the separate Docker PostgreSQL 17 schema mirrors canonical SQL while Auth, Storage, Realtime and app API routing remain distinct. The legacy demo still runs on PostgreSQL 16.

### Docker Deployment

```bash
# Start all services with unified gateway
docker compose up -d

# Gateway runs on port 8080
curl http://localhost:8080/health
curl http://localhost:8080/api/health
curl http://localhost:8080/admin
```

## Environment Variables

**Local development uses a single shared `GreenPlus/.env.local` for Web Admin,
Web Client, and Web Shipper.** Put machine-specific credentials and AI config there.
The root `.env` is an optional fallback and is also used by Docker Compose;
OS/Vercel/CI environment variables take precedence. Never add secrets with a
`NEXT_PUBLIC_` prefix. Do not keep `web-admin/.env.local`, `web-client/.env.local`,
or `web-shipper/.env.local`: Next.js would auto-load those workspace files.
Merge any useful existing keys into the root file and back up/remove workspace
files before starting any app. Keep `.env.local` out of Git (already ignored).

Example (replace placeholders locally and **never commit** this file):

```dotenv
GREENPLUS_AI_SERVICE_URL=http://127.0.0.1:8100
GREENPLUS_AI_SERVICE_KEY=REPLACE_WITH_RANDOM_32_BYTE_PLUS_SECRET
```

Restart `npm run web` after editing the shared file. Docker Compose and the
AI service may still require the appropriate keys supplied in root `.env` or
via host/container environment; this change affects Next.js app loading, not
Docker Compose's separate dotenv handling.

Create `.env` in project root (fallback and Docker configuration):

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # Admin app only — protected API routes
SUPABASE_PASS=                   # DB direct connection / migrations
AUTH_HANDOFF_SECRET=             # Shared server-side signing key for Admin, Client and Shipper (32+ bytes)
NEXT_PUBLIC_WEB_CLIENT_URL=http://localhost:3001
NEXT_PUBLIC_WEB_ADMIN_URL=http://localhost:3000
NEXT_PUBLIC_WEB_SHIPPER_URL=http://localhost:3002

# Optional
SENTRY_DSN_ADMIN=
SENTRY_DSN_CLIENT=
SENTRY_AUTH_TOKEN=               # Only needed in CI for sourcemap uploads
SENTRY_ORG=
NEXT_PUBLIC_SENTRY_ORG=
SENTRY_PROJECT_CLIENT=
NEXT_PUBLIC_SENTRY_PROJECT_CLIENT=
SENTRY_PROJECT_ADMIN=
NEXT_PUBLIC_SENTRY_PROJECT_ADMIN=

BETTER_STACK_SOURCE_TOKEN=
NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN=
BETTER_STACK_URL=
NEXT_PUBLIC_BETTER_STACK_URL=
```

## API Gateway Routes

The unified Nginx gateway on port 8080 provides:

```
GET  /health                 → Nginx health check
GET  /api/*                  → web-admin REST APIs
GET  /admin/*                → web-admin frontend (path-based)
GET  /*                      → web-client frontend (default)
```

## CI/CD Pipelines

Three GitHub Actions workflows:

| Workflow             | Trigger                   | What It Does                               |
| -------------------- | ------------------------- | ------------------------------------------ |
| `ci.yml`             | Push and PRs             | 3-app frontend matrix + backend + Docker/Supabase DB + external checks → guarded GHCR publish |
| `deploy-staging.yml` | Manual verification      | Verify SHA-pinned staging images (does **not** deploy) |
| `deploy-prod.yml`    | Successful `main` CI     | Verify SHA-pinned GHCR + Vercel production + PWA (does **not** deploy) |

Configure GitHub Secrets: Settings → Secrets → Add repository secrets

## Monitoring & Observability

### Health Checks

```bash
# Gateway health (Nginx)
curl http://localhost:8080/health

# Service health endpoints
curl http://localhost:8080/health           # Nginx
curl http://localhost:8080/api/health       # web-client
curl http://localhost:8080/admin/api/health # web-admin
```

### Logging (Better Stack)

- Automatic request logging via middleware
- Custom application logging via `logger` utility
- Uptime monitoring with alerts

### Error Tracking (Sentry)

- Client-side error captures
- Server-side exception tracking
- Sourcemap uploads in CI/CD
- Optional but recommended

## Build Output

### web-client

- 22 routes (frontend + APIs)
- Supabase Auth integration
- React Query data fetching
- Zustand state management

### web-admin

- 12 routes (frontend + APIs)
- Service-role protected APIs
- Realtime subscriptions
- Signed file uploads

## Common Commands

```bash
# Development
npm run dev                # All apps
npm run dev:client         # web-client only
npm run dev:admin          # web-admin only
npm run dev:shipper        # web-shipper only

# Validation
npm run lint               # ESLint all packages
npm run typecheck          # TypeScript check all packages
npm run build              # Production build

# Docker
docker-compose build       # Build images
docker compose up -d       # Start services
docker-compose logs -f     # View logs
docker-compose down        # Stop services
```

## Deployment

### Local / Development

```bash
npm run dev
```

### Staging (Docker)

```bash
docker-compose build
docker compose up -d

# Or push to develop branch to trigger GitHub Actions
git push origin develop
```

### Production

```bash
# Push to main branch to trigger GitHub Actions
git push origin main

# Or manually deploy:
docker-compose pull
docker compose up -d
```

## Performance

- TypeScript compilation: ~16s
- Full build: ~1m 20s
- Docker image size: ~800MB (multi-stage)
- Health check response: <100ms
- API endpoint response: <500ms (typical)

## Security

✅ **Authentication**: Supabase Auth with JWT tokens
✅ **Authorization**: PostgreSQL RLS policies per role
✅ **Storage**: Signed uploads (server-side tokens)
✅ **Gateway**: Reverse proxy isolation
✅ **Secrets**: Service role key never fallback (enforced at runtime)
✅ **CI/CD**: GitHub encrypted secrets
✅ **Monitoring**: Better Stack with alert policies

## Troubleshooting

### Apps not starting

```bash
npm install
npm run build
docker-compose build
```

### Gateway routing issues

```bash
docker-compose logs nginx
curl docker-compose.exec nginx curl http://web-client:3000/health
```

### TypeScript errors

```bash
npm run typecheck
# Fix errors or
npm run typecheck -- --pretty
```

### Docker build fails

```bash
docker system prune
docker-compose build --no-cache
```

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and validate: `npm run lint && npm run typecheck && npm run build`
3. Push branch: `git push origin feature/my-feature`
4. GitHub Actions CI will run automatically
5. Create Pull Request
6. After approval, merge to develop (staging) or main (production)

### Deployment notes (November 2026)

- Development: Admin `http://localhost:3000`, Client `http://localhost:3001`, Shipper `http://localhost:3002`, three-tier gateway `http://127.0.0.1:4100`.
- The **full** `docker-compose.yml` keeps **internal** client `3000`, admin `3001`, shipper `3002` for image compatibility, but maps default **host** Admin to `3000`, Client to `3001`. Never run it alongside the Next.js development servers on the same host ports.
- `npm run dev` starts only the **three-tier database Docker stack**, not the full production web Docker Compose stack, before launching Turbo TUI.
- To deploy to Vercel, configure three projects with Root Directories `web-admin`, `web-client`, and `web-shipper`. Configure their respective environment variables without exposing service-role/session secrets as `NEXT_PUBLIC_*`.
- Client and Shipper are installable PWAs; Android TWA setup requires deployed HTTPS origins and signing certificate fingerprints. See `docs/VERCEL_MOBILE_RELEASE.md`.
- Existing Flutter app skeletons in `mobile/customer_app` and `mobile/shipper_app` are **not** compiled production apps and must not be confused with the PWA/TWA path.

#### Mobile release verification (PWA/TWA is the chosen implementation)

```powershell
npm run test
# Replace each URL with the actual deployed production HTTPS origin
npm run mobile -- client preflight https://YOUR-CLIENT-DOMAIN/
npm run mobile -- shipper preflight https://YOUR-SHIPPER-DOMAIN/
# Only after Bubblewrap initialization + signing + public SHA256 configuration:
npm run mobile -- client check https://YOUR-CLIENT-DOMAIN/
npm run mobile -- shipper check https://YOUR-SHIPPER-DOMAIN/
```

The PWA includes a safe offline shell and user-controlled worker updates. Shipper supports camera/QR-photo decoding and manual order lookup. **Only actual device testing** can confirm WebAPK installability, Android TWA Digital Asset Links, camera/GPS permissions and login. The current Docker data-source switch affects supported Admin sandbox routes, **not** the production Client/Shipper data stores. See `mobile/README.md` for current PWA/TWA instructions and acceptance limitations.

- CI publishes GHCR images **after** all mandatory gates; it does not automatically deploy Coolify. `Production Verify` only verifies deployed images/Vercel state and should not be interpreted as a deployment action.


### Repository maintenance / legacy cleanup (Nov 2026)

Use `npm run audit:unused` for a read-only whole-repository report (`artifacts/audits/unused-files.json`). It marks only review candidates: dynamic references and Next.js routes cannot be proven unused statically. The older checksum-allowlisted maintenance audit is still available as `node scripts/repo-maintenance.mjs scan` (read-only).
If you deliberately need the legacy quarantine workflow, use `node scripts/repo-maintenance.mjs clean` to preview, or `node scripts/repo-maintenance.mjs all --apply --zip` after backups; restore via `node scripts/repo-maintenance.mjs restore`. This is optional, NOT part of `npm run audit:unused`.
To archive obsolete Flutter prototypes as well, add `--legacy-flutter`. The scanner never deletes source and the legacy quarantine requires manual opt-in.
`npm run check-all` and `npm run lint` inspect code without formatting or deleting source.

See [the Docker three-tier command reference](docker/three-tier/README.md) for Docker/PWA subcommands and maintenance recovery.


## AI Assist rollout

For the isolated FastAPI AI service, five-role assistants, manager-governed promotions and Docker sandbox preview, see [the AI service guide](services/ai-assist/README.md). Apply migrations only after verifying existing Supabase migration history.
