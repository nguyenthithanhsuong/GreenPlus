# syntax=docker/dockerfile:1
# All commands operate from the npm workspace root.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY web-admin/package.json ./web-admin/package.json
COPY web-client/package.json ./web-client/package.json
COPY web-shipper/package.json ./web-shipper/package.json
COPY packages/supabase-shared/package.json ./packages/supabase-shared/package.json
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Supabase service role and session secret are intentionally NOT Docker build args.
# They must only be supplied to the running container.
RUN npm run build -w web-shipper \
    && test -f web-shipper/.next/standalone/web-shipper/server.js

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3002 \
    HOSTNAME=0.0.0.0

RUN addgroup -S greenplus && adduser -S greenplus -G greenplus
# outputFileTracingRoot is the monorepo root, so the standalone entry lives at
# /app/web-shipper/server.js and shared packages are traced as needed.
COPY --from=builder --chown=greenplus:greenplus /app/web-shipper/.next/standalone ./
COPY --from=builder --chown=greenplus:greenplus /app/web-shipper/.next/static ./web-shipper/.next/static
COPY --from=builder --chown=greenplus:greenplus /app/web-shipper/public ./web-shipper/public
RUN mkdir -p /app/web-shipper/.next && chown -R greenplus:greenplus /app/web-shipper/.next
USER greenplus
WORKDIR /app/web-shipper
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3002/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "server.js"]
