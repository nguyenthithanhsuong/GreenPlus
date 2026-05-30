# Phase 3: Gateway + Observability + CI/CD

## Overview

Phase 3 completes the infrastructure layer of GreenPlus with:
1. **Unified API Gateway** - Single port (8080) with path-based routing
2. **Health Monitoring** - Standard endpoints for uptime checks
3. **Better Stack Integration** - Centralized logging and alerting
4. **GitHub Actions CI/CD** - Automated testing, building, and deployment

## 1. Unified API Gateway (Nginx)

### Architecture

The nginx reverse proxy now uses path-based routing on a single port:

```
Port 8080
├── / → web-client (port 3000)
├── /admin/* → web-admin (port 3001)
├── /api/* → web-admin APIs (port 3001)
└── /health → Nginx health endpoint
```

### Route Details

| Route | Upstream | Description |
|-------|----------|-------------|
| `/health` | Nginx | Gateway health check (no proxy) |
| `/api/*` | web-admin:3001 | Admin API routes |
| `/admin/*` | web-admin:3001 | Admin frontend (with path rewrite) |
| `/*` | web-client:3000 | Client frontend (default) |

### Docker Changes

**Before:**
```yaml
ports:
  - "8080:80"
  - "8081:81"
```

**After:**
```yaml
ports:
  - "8080:80"
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Testing the Gateway

```bash
# Local testing after starting docker-compose
curl http://localhost:8080/health          # Gateway health
curl http://localhost:8080/api/health      # Web-client health
curl http://localhost:8080/admin/api/health # Web-admin health

# Path-based routing examples
curl http://localhost:8080/                 # web-client frontend
curl http://localhost:8080/admin/           # web-admin frontend
curl http://localhost:8080/api/auth         # web-admin auth API
```

## 2. Health Endpoints

### Endpoints Added

Both web-client and web-admin now expose:

**GET /api/health**

Response:
```json
{
  "status": "ok",
  "service": "web-client",
  "timestamp": "2026-03-30T12:00:00Z",
  "uptime": 3600.5,
  "environment": "production",
  "version": "1.0.0"
}
```

### Use Cases

- Load balancer health checks
- Uptime monitoring (Better Stack)
- Dependency checks during deployment
- Simple availability verification

### Implementation

Health endpoints are lightweight and don't hit the database, ensuring:
- Fast response times (<100ms)
- Low resource usage
- No dependency on backend services

## 3. Better Stack Integration

### Setup Checklist

- [ ] Create Better Stack account (https://betterstack.com)
- [ ] Create HTTP Log Source
- [ ] Copy Source Token to `.env.local` as `BETTER_STACK_SOURCE_TOKEN`
- [ ] Create 3 uptime monitors (see BETTER_STACK_SETUP.md)
- [ ] Configure alert policies
- [ ] Test log delivery

### Logging Features

**Automatic Logging:**
- All `/api/*` requests logged via middleware
- Request method, path, and timestamp captured
- Async logging (doesn't block requests)

**Application Logging:**
```typescript
import { logger } from '@greenplus/supabase-shared';

logger.debug('Debug info', { userId: '123' });
logger.info('User action', { action: 'login' });
logger.warning('Deprecated endpoint', { endpoint: '/old' });
logger.error('Failed operation', { reason: 'timeout' }, userId);
logger.critical('Service down', { service: 'database' });
```

### Alerts

Configure in Better Stack Dashboard:
- **5xx Error Spike**: > 10 errors in 5 minutes
- **Downtime**: > 2 minutes without response
- **High Latency**: Response time > 5 seconds

### Environment Variables

```env
BETTER_STACK_SOURCE_TOKEN=eyJ... # From Better Stack dashboard
```

## 4. GitHub Actions CI/CD

### Workflows

Three workflows are now available:

#### ci.yml (Runs on: Push to main/develop, PRs)

**Steps:**
1. Lint - ESLint validation
2. TypeCheck - TypeScript compilation (`tsc --noEmit`)
3. Build - Full production build
4. Docker Build - Build web-client and web-admin images
5. Sentry Upload - Upload sourcemaps (main branch only)

**Outputs:**
- Docker images tagged with branch/git sha
- Sentry sourcemaps for error tracking
- Build cache for faster subsequent runs

#### deploy-staging.yml (Runs on: Push to develop branch)

**Steps:**
1. Build and push Docker images with `staging` tag
2. Deploy to staging environment (customizable)
3. Notification (customizable)

**TODO:** Implement platform-specific deployment (k8s, AWS ECS, docker-compose, etc.)

#### deploy-prod.yml (Runs on: Push to main branch, manual trigger)

**Steps:**
1. Build and push Docker images with `latest` tag
2. Create GitHub release
3. Deploy to production (customizable)
4. Run smoke tests (customizable)
5. Team notification (customizable)

**TODO:** Implement production deployment process

### GitHub Secrets Required

Add these to your GitHub repository settings (Settings → Secrets and variables → Actions):

**For Sentry Sourcemap Upload:**
```
SENTRY_ORG              # Sentry organization slug
SENTRY_PROJECT_CLIENT   # Sentry project slug for web-client
SENTRY_PROJECT_ADMIN    # Sentry project slug for web-admin
SENTRY_AUTH_TOKEN       # Sentry authentication token
```

**For Deployment (if using external platforms):**
```
AWS_ACCOUNT_ID          # (if using AWS)
AWS_ACCESS_KEY_ID       # (if deploying to AWS)
AWS_SECRET_ACCESS_KEY   # (if deploying to AWS)
REGISTRY_USERNAME       # (if using private registry)
REGISTRY_PASSWORD       # (if using private registry)
```

### Local Build Validation

Before pushing, validate locally:

```bash
# Lint check
npm run lint

# TypeScript check
npm run typecheck

# Full build
npm run build

# Docker build simulation
docker buildx build --file web-client/Dockerfile .
```

## 5. Project Structure

### New Files

```
.github/workflows/
├── ci.yml                      # Main CI workflow (lint, typecheck, build, docker, sentry)
├── deploy-staging.yml          # Staging deployment workflow
└── deploy-prod.yml             # Production deployment workflow

nginx/
└── nginx.conf                  # Updated with path-based routing

packages/supabase-shared/
├── src/logger.ts              # Better Stack logger utility
└── src/index.ts               # Exports logger

web-client/
├── middleware.ts              # Request logging middleware
├── src/app/api/health/route.ts # Health endpoint
└── package.json               # Added typecheck script

web-admin/
├── middleware.ts              # Request logging middleware
├── src/app/api/health/route.ts # Health endpoint
└── package.json               # Added typecheck script

BETTER_STACK_SETUP.md           # Better Stack integration guide (this file)
PHASE_3_SETUP.md               # This file
```

### Modified Files

```
docker-compose.yml             # Removed port 8081, added healthcheck, env vars
turbo.json                      # Added typecheck task
package.json                    # Added typecheck script
web-client/package.json         # Added typecheck script
web-admin/package.json          # Added typecheck script
```

## 6. Deployment Guide

### Local Deployment

```bash
# Build docker images
docker-compose build

# Run containers with healthcheck
docker-compose up -d

# Verify gateway
curl http://localhost:8080/health
curl http://localhost:8080/api/health
curl http://localhost:8080/admin/api/health

# View logs
docker-compose logs -f nginx
docker-compose logs -f web-client
docker-compose logs -f web-admin
```

### Staging Deployment

1. Push to `develop` branch
2. GitHub Actions automatically builds and pushes Docker images to `ghcr.io`
3. Customize `deploy-staging.yml` with your deployment platform commands
4. Images tagged as `staging` and `develop`

### Production Deployment

1. Create a release on main branch
2. GitHub Actions builds and pushes images with `latest` tag
3. Create GitHub Release with image references
4. Customize `deploy-prod.yml` with your deployment platform
5. Run smoke tests and notify team

### Rollback

If issues occur:

```bash
# Revert deployment
docker-compose pull web-client web-admin
docker-compose up -d

# Or deploy previous Git tag
git checkout <previous-tag>
docker-compose build
docker-compose up -d
```

## 7. Monitoring & Observability

### What's Monitored

✅ **Uptime**
- Gateway health checks every 30 seconds
- Each service monitored independently

✅ **Logs**
- API request logs (method, path, response time)
- Application errors and warnings
- Better Stack dashboard searchable

✅ **Performance**
- Response times tracked in logs
- Sentry captures client-side errors
- Docker container health status

### Alerts & Notifications

Configure in Better Stack:
- Slack notifications
- Email alerts
- PagerDuty integration
- Custom webhooks

### Metrics & Dashboards

**Docker:**
```bash
docker stats              # Real-time container stats
docker-compose events     # Container lifecycle events
```

**Better Stack Dashboard:**
- Uptime percentage
- Response time graphs
- Error rate trends
- Log stream with search/filter

## 8. Security Considerations

### Nginx Gateway
- ✅ All upstream services on private network (not exposed externally)
- ✅ Reverse proxy handles external traffic
- ✅ HTTP headers properly set for security

### Environment Variables
- ✅ Service role key never falls back to anon
- ✅ Better Stack token is optional (logging degrades gracefully)
- ✅ All secrets stored in GitHub encrypted secrets

### Deployment
- ✅ Images built in CI, not locally committed
- ✅ Sourcemaps uploaded to Sentry (not shipped to client)
- ✅ Production deployment flow (customize before use)

## 9. Troubleshooting

### Health endpoint returns 500

```bash
# Check application is running
docker-compose ps

# View container logs
docker-compose logs web-client
docker-compose logs web-admin

# Check port bindings
docker-compose port web-client 3000
```

### Gateway routing not working

```bash
# Check nginx container
docker-compose logs nginx

# Verify upstream services
curl http://web-client:3000/health
curl http://web-admin:3001/health

# Test from gateway
docker-compose exec nginx curl http://localhost/health
```

### Logs not appearing in Better Stack

- Verify `BETTER_STACK_SOURCE_TOKEN` is set
- Check network connectivity from container
- View application logs: `docker-compose logs web-admin`
- Test manually:
  ```bash
  curl -X POST https://in.betterstack.com/api/v1/logs \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"dt":"2026-03-30T12:00:00Z","level":"INFO","message":"test"}'
  ```

### Docker build fails in CI

- Check available GitHub disk space
- Review build-time environment variables
- Verify Dockerfile references use correct paths
- Check node_modules caching

## 10. Next Steps

### Post-Phase 3

1. **Configure Platform-Specific Deployment**
   - Add commands to `deploy-staging.yml` for your platform (k8s, ECS, etc.)
   - Add commands to `deploy-prod.yml` with safety checks and rollback

2. **Set Up GitHub Secrets**
   - Add Sentry secrets for sourcemap uploads
   - Add deployment credentials

3. **Enable Better Stack Monitoring**
   - Create uptime monitors
   - Configure alert policies
   - Set up notification channels

4. **Test CI/CD Pipeline**
   - Create PR to trigger CI workflow
   - Verify lint, typecheck, build all pass
   - Review Docker image build

5. **Update Documentation**
   - Document your deployment process
   - Create runbooks for common issues
   - Share secrets management procedure

### Phase 3.5 (Optional Enhancements)

- [ ] Add end-to-end (E2E) tests to CI
- [ ] Add performance benchmarking
- [ ] Implement blue-green or canary deployments
- [ ] Add automatic rollback on failed health checks
- [ ] Set up custom Better Stack dashboards
- [ ] Integrate with incident management (PagerDuty)
- [ ] Add cost monitoring and alerting

### Phase 4 (Future)

- [ ] Database migrations testing
- [ ] Secrets rotation automation
- [ ] Multi-region deployment
- [ ] Advanced rate limiting and DDoS protection
- [ ] API versioning strategy
- [ ] GraphQL subscription monitoring
