# syntax=docker/dockerfile:1
# Next standalone runtime: no source tree or devDependencies in the published image.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY web-admin/package.json ./web-admin/package.json
COPY web-client/package.json ./web-client/package.json
COPY web-shipper/package.json ./web-shipper/package.json
COPY packages/supabase-shared/package.json ./packages/supabase-shared/package.json
COPY packages/tenant-routing/package.json ./packages/tenant-routing/package.json
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SENTRY_DSN_CLIENT
ARG SENTRY_DSN_CLIENT
ARG SENTRY_ORG
ARG SENTRY_PROJECT_CLIENT
ARG GITHUB_SHA
ARG NEXT_PUBLIC_GITHUB_SHA

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SENTRY_DSN_CLIENT=$NEXT_PUBLIC_SENTRY_DSN_CLIENT
ENV SENTRY_DSN_CLIENT=$SENTRY_DSN_CLIENT
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT_CLIENT
ENV SENTRY_PROJECT_CLIENT=$SENTRY_PROJECT_CLIENT
ENV GITHUB_SHA=$GITHUB_SHA
ENV NEXT_PUBLIC_GITHUB_SHA=$NEXT_PUBLIC_GITHUB_SHA

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The dummy key is never baked into the runtime image.
RUN SUPABASE_SERVICE_ROLE_KEY=ci-build-only-not-a-real-key npm run build -w web-client \
    && test -f web-client/.next/standalone/web-client/server.js

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001 \
    HOSTNAME=0.0.0.0
RUN addgroup -S greenplus && adduser -S greenplus -G greenplus
COPY --from=builder --chown=greenplus:greenplus /app/web-client/.next/standalone ./
COPY --from=builder --chown=greenplus:greenplus /app/web-client/.next/static ./web-client/.next/static
COPY --from=builder --chown=greenplus:greenplus /app/web-client/public ./web-client/public
RUN mkdir -p /app/web-client/.next && chown -R greenplus:greenplus /app/web-client/.next
USER greenplus
WORKDIR /app/web-client
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/',{redirect:'manual'}).then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
