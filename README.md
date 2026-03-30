# GreenPlus

Production-ready SaaS platform built with Next.js, Supabase, and Turborepo.

## Features

✅ **Phase 1**: Supabase Auth + State Management (Zustand + React Query)
✅ **Phase 2**: Realtime Subscriptions + File Storage
✅ **Phase 3**: Unified API Gateway + Observability + CI/CD
- 🔗 Single unified port (8080) with path-based routing
- 📊 Health checks & uptime monitoring (Better Stack)
- 🔄 GitHub Actions CI/CD with Docker builds
- 📝 Comprehensive logging and alerting

## Quick Start

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

### Docker Deployment

```bash
# Start all services with unified gateway
docker-compose up -d

# Gateway runs on port 8080
curl http://localhost:8080/health
curl http://localhost:8080/api/health
curl http://localhost:8080/admin
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

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **State** | Zustand, React Query v5 |
| **API** | Next.js App Router, REST |
| **Authentication** | Supabase Auth |
| **Database** | Supabase PostgreSQL + RLS |
| **Realtime** | Supabase Realtime (postgres_changes) |
| **Storage** | Supabase Storage (signed uploads) |
| **Observability** | Sentry, Better Stack, GitHub Actions |
| **Containerization** | Docker, Docker Compose |
| **Gateway** | Nginx with path-based routing |
| **Monorepo** | Turborepo |

## Environment Variables

Create `.env.local` in project root:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Admin only

# Optional
BETTER_STACK_SOURCE_TOKEN=              # Logging
SENTRY_DSN=                             # Error tracking
NEXT_PUBLIC_SENTRY_DSN=                 # Client errors
```

See [ENV_VARS_REFERENCE.md](ENV_VARS_REFERENCE.md) for complete documentation.

## Documentation

- 📖 [ENV_VARS_REFERENCE.md](ENV_VARS_REFERENCE.md) - Environment configuration guide
- 🚀 [PHASE_3_QUICKSTART.md](PHASE_3_QUICKSTART.md) - Quick setup & validation
- 🏗️ [PHASE_3_SETUP.md](PHASE_3_SETUP.md) - Complete Phase 3 reference
- 📊 [BETTER_STACK_SETUP.md](BETTER_STACK_SETUP.md) - Monitoring & alerting guide
- 🎯 [DesignPattern.MD](DesignPattern.MD) - Architecture patterns

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
curl http://localhost:8080/api/health      # web-client
curl http://localhost:8080/admin/api/health # web-admin
```

### Logging (Better Stack)

- Automatic request logging via middleware
- Custom application logging via `logger` utility
- Uptime monitoring with alerts
- See [BETTER_STACK_SETUP.md](BETTER_STACK_SETUP.md)

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

See [PHASE_3_SETUP.md](PHASE_3_SETUP.md#9-troubleshooting) for more.

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and validate: `npm run lint && npm run typecheck && npm run build`
3. Push branch: `git push origin feature/my-feature`
4. GitHub Actions CI will run automatically
5. Create Pull Request
6. After approval, merge to develop (staging) or main (production)

## Support & Next Steps

- 📚 Start with [PHASE_3_QUICKSTART.md](PHASE_3_QUICKSTART.md) for immediate validation
- 🔧 Follow [BETTER_STACK_SETUP.md](BETTER_STACK_SETUP.md) to enable monitoring
- 🚀 Customize deployment workflows in `.github/workflows/deploy-*.yml`
- 📖 Reference [PHASE_3_SETUP.md](PHASE_3_SETUP.md) for detailed architecture

---

**Status**: ✅ Phase 3 Complete  
**Build**: ✅ Passing (web-client + web-admin)  
**Gateway**: ✅ Unified on port 8080  
**CI/CD**: ✅ GitHub Actions active  
**Monitoring**: ✅ Better Stack ready  