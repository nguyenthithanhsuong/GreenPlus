# GreenPlus

A Full-Stack Smart E-Grocery Platform for Organic Produce, with two web applications: Web Admin and Web Client. Frontend built with Next.js, Tailwind CSS, Zustand, and TanStack Query. Backend powered by Supabase (PostgreSQL · Auth · Realtime · Storage). DevOps via Docker, Nginx, and GitHub Actions · Monitoring via Sentry + BetterStack.

[![CI](https://github.com/nguyenthithanhsuong/GreenPlus/actions/workflows/ci.yml/badge.svg)](https://github.com/nguyenthithanhsuong/GreenPlus/actions/workflows/ci.yml)

[![Deploy to Staging](https://github.com/nguyenthithanhsuong/GreenPlus/actions/workflows/deploy-staging.yml/badge.svg)](https://github.com/nguyenthithanhsuong/GreenPlus/actions/workflows/deploy-staging.yml)

[![Deploy to Production](https://github.com/nguyenthithanhsuong/GreenPlus/actions/workflows/deploy-prod.yml/badge.svg)](https://github.com/nguyenthithanhsuong/GreenPlus/actions/workflows/deploy-prod.yml)

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15, React 19, TypeScript |
| **Styling** | Tailwind CSS |
| **State** | Zustand, TanStack Query v5 |
| **API** | Next.js App Router, REST |
| **Authentication** | Supabase Auth (JWT) |
| **Database** | Supabase PostgreSQL + RLS |
| **Realtime** | Supabase Realtime (postgres_changes) |
| **Storage** | Supabase Storage (signed uploads) |
| **Gateway** | Nginx with path-based routing |
| **Containerization** | Docker, Docker Compose |
| **Monorepo** | Turborepo |
| **CI/CD** | GitHub Actions |
| **Error Tracking** | Sentry |
| **Observability** | Sentry, Better Stack, GitHub Actions |


### Local Development

```bash
# Install dependencies
npm install

# Start both apps with development server
npm run dev

# Or start individual apps
npm run dev:client   # Port 3000
npm run dev:admin    # Port 3001

# Check code quality
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm run build       # Full production build
```
## Project Structure

```
GreenPlus/
├── web-client/          # Customer-facing app (Port 3000)
├── web-admin/           # Admin dashboard (Port 3001)
├── packages/supabase-shared/ # Shared utilities
├── nginx/               # Gateway reverse proxy
├── .github/workflows/   # CI/CD pipelines
├── docker-compose.yml   # Local deployment
└── README.md
```

### Docker Deployment

```bash
# Start all services with unified gateway
docker-compose up -d

# Gateway runs on port 8080
curl http://localhost:8080/health
curl http://localhost:8080/api/health
curl http://localhost:8080/admin
```

## Environment Variables

Create `.env` in project root:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # Admin app only — protected API routes
SUPABASE_PASS=                   # DB direct connection / migrations
AUTH_HANDOFF_SECRET=             # Cross-app auth between web-client and web-admin
NEXT_PUBLIC_WEB_CLIENT_URL=http://localhost:3000
NEXT_PUBLIC_WEB_ADMIN_URL=http://localhost:3001

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

| Workflow | Trigger | What It Does |
|----------|---------|------------|
| `ci.yml` | Push to main/develop, PRs | Lint → TypeCheck → Build → Docker → Sentry |
| `deploy-staging.yml` | Push to develop | Build images → Deploy to staging |
| `deploy-prod.yml` | Manual or main push | Build images → Deploy to production |

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

# Validation
npm run lint               # ESLint all packages
npm run typecheck          # TypeScript check all packages
npm run build              # Production build

# Docker
docker-compose build       # Build images
docker-compose up -d       # Start services
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
docker-compose up -d

# Or push to develop branch to trigger GitHub Actions
git push origin develop
```

### Production
```bash
# Push to main branch to trigger GitHub Actions
git push origin main

# Or manually deploy:
docker-compose pull
docker-compose up -d
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
