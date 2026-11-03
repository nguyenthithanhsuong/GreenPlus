# Runtime-only secrets (SUPABASE_SERVICE_ROLE_KEY, SENTRY_AUTH_TOKEN, BETTER_STACK_SOURCE_TOKEN)
# are not build ARGs or image ENV. Supply them to the running service, not docker build.
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY web-client/package.json ./web-client/package.json
COPY web-admin/package.json ./web-admin/package.json
COPY web-shipper/package.json ./web-shipper/package.json
COPY packages/supabase-shared/package.json ./packages/supabase-shared/package.json

RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

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


# Build-time DUMMY key for module import validation; never a real credential.
RUN SUPABASE_SERVICE_ROLE_KEY=ci-build-only-not-a-real-key npm run build -w web-client

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app .

EXPOSE 3000

CMD ["npm", "run", "start", "-w", "web-client"]
