# Environment Variables Reference

## Overview

GreenPlus uses the following environment variables. Configure them in:
- Local: `.env.local`
- Docker: `docker-compose.yml`
- CI/CD: GitHub Repository Secrets
- Server: Environment or `.env` files

## Service Configuration

### Required (All Environments)

```env
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend only (web-admin, API routes)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Optional (Recommended)

```env
# Better Stack logging
BETTER_STACK_SOURCE_TOKEN=your-better-stack-token

# Sentry error tracking
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Environment indicator
NODE_ENV=production|development|staging
```

## By Application

### web-client

```env
# Via docker-compose.yml or .env.local
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SENTRY_DSN=...
BETTER_STACK_SOURCE_TOKEN=...
```

### web-admin

```env
# Via docker-compose.yml or .env.local
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SENTRY_DSN=...
NEXT_PUBLIC_SENTRY_DSN=...
BETTER_STACK_SOURCE_TOKEN=...
```

## By Environment

### Local Development

`.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BETTER_STACK_SOURCE_TOKEN=your-token
NEXT_PUBLIC_SENTRY_DSN=your-dsn
SENTRY_DSN=your-dsn
```

### Docker Compose (staging/production)

`docker-compose.yml`:
```yaml
environment:
  NODE_ENV: production
  NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
  SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
  BETTER_STACK_SOURCE_TOKEN: ${BETTER_STACK_SOURCE_TOKEN:-}
  SENTRY_DSN: ${SENTRY_DSN:-}
  NEXT_PUBLIC_SENTRY_DSN: ${NEXT_PUBLIC_SENTRY_DSN:-}
```

### GitHub Actions (CI/CD Secrets)

GitHub Settings → Secrets and variables → Actions:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SENTRY_ORG
SENTRY_PROJECT_CLIENT
SENTRY_PROJECT_ADMIN
SENTRY_AUTH_TOKEN
```

## Variable Details

### Supabase

| Variable | Type | Required | Example |
|----------|------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Yes | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Yes | `eyJhbGc...` (56 chars) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Yes (admin) | `eyJhbGc...` (longer key) |

**Get these from:** Supabase Dashboard → Settings → API

### Better Stack

| Variable | Type | Required | Example |
|----------|------|----------|---------|
| `BETTER_STACK_SOURCE_TOKEN` | Secret | No | `eyJ...` (from HTTP source) |

**Get this from:** Better Stack → Log Sources → Create HTTP Source → Copy Token

**Recommended:** Set in production and staging only (dev can be without)

### Sentry (Error Tracking)

| Variable | Type | Required | Example |
|----------|------|----------|---------|
| `SENTRY_ORG` | Secret | No | `my-org` |
| `SENTRY_PROJECT_CLIENT` | Secret | No | `web-client` |
| `SENTRY_PROJECT_ADMIN` | Secret | No | `web-admin` |
| `SENTRY_AUTH_TOKEN` | Secret | No | `sntrys_...` |
| `SENTRY_DSN` | Secret | No | `https://key@sentry.io/123456` |
| `NEXT_PUBLIC_SENTRY_DSN` | Public | No | `https://key@sentry.io/123456` |

**Get these from:** Sentry → Settings → API → Authentication Tokens

### Other

| Variable | Type | Default | Options |
|----------|------|---------|---------|
| `NODE_ENV` | String | development | `development`, `production`, `staging` |
| `PORT` | Number | 3000/3001 | Any available port |
| `NEXT_TELEMETRY_DISABLED` | String | 1 (disabled) | 0 (enabled), 1 (disabled) |

## Security Notes

⚠️ **CRITICAL**:
- Never commit `.env.local` to git
- Never share `SUPABASE_SERVICE_ROLE_KEY`
- Rotate keys if accidentally exposed
- Use GitHub encrypted secrets for CI/CD

✅ **Safe to share**:
- `NEXT_PUBLIC_SUPABASE_URL` (only URL)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (row-level security enforced)
- `NEXT_PUBLIC_SENTRY_DSN` (error tracking, not sensitive)

✅ **Safe in environment**:
- `NEXT_PUBLIC_*` variables (only passed to client)
- `NODE_ENV` (non-sensitive indicator)

❌ **Never expose**:
- `SUPABASE_SERVICE_ROLE_KEY` (full database access)
- `SENTRY_AUTH_TOKEN` (can modify projects)
- `BETTER_STACK_SOURCE_TOKEN` (can send logs)

## Setup Instructions

### Step 1: Gather Credentials

1. **Supabase**: Go to Dashboard → Settings → API
   - Copy Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

2. **Better Stack** (Optional):
   - Create HTTP Log Source
   - Copy token → `BETTER_STACK_SOURCE_TOKEN`

3. **Sentry** (Optional):
   - Create new projects for web-client and web-admin
   - Get project DSNs → `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`
   - Create auth token → `SENTRY_AUTH_TOKEN`

### Step 2: Configure Locally

Create `.env.local` in project root:

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BETTER_STACK_SOURCE_TOKEN=
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
EOF
```

### Step 3: Configure Docker

1. Create `.env` in project root (referenced by docker-compose.yml)
2. Or configure in `docker-compose.yml` directly
3. Restart containers: `docker-compose restart`

### Step 4: Configure GitHub (CI/CD)

1. Go to GitHub Repo → Settings → Secrets and variables → Actions
2. Add each secret:
   - Click "New repository secret"
   - Enter name and value
   - Click "Add secret"

Required secrets for CI/CD:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SENTRY_ORG
SENTRY_PROJECT_CLIENT
SENTRY_PROJECT_ADMIN
SENTRY_AUTH_TOKEN
```

## Validation

```bash
# Check if environment is configured
npm run build

# If build succeeds with warnings about missing env vars, it's OK
# (they're optional for development)

# Verify required vars are set
echo $SUPABASE_SERVICE_ROLE_KEY  # Should output a key for admin routes to work
```

## Troubleshooting

### "Cannot read property 'supabase_url' of undefined"
- Check `NEXT_PUBLIC_SUPABASE_URL` is set
- Verify no typos in variable names
- Restart `npm run dev` after setting env vars

### Admin endpoints returning 401
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in server environment
- Not in `.env.local` but in container environment
- For docker-compose, check docker-compose.yml has the env var

### Better Stack logs not appearing
- Check `BETTER_STACK_SOURCE_TOKEN` is valid
- Container must have network access to `in.betterstack.com`
- For dev, it's OK to leave empty (logging is optional)

### CI/CD secrets not working
- Verify secrets are added to GitHub repo settings (not organization)
- Secrets are case-sensitive
- Wait 5 minutes after adding secrets for GitHub to propagate
- Check Actions workflow file references correct secret names

## References

- Supabase Docs: https://supabase.com/docs
- Better Stack Docs: https://betterstack.com/docs
- Sentry Docs: https://docs.sentry.io
- Next.js Env: https://nextjs.org/docs/basic-features/environment-variables
