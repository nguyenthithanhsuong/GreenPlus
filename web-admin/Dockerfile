FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY web-client/package.json ./web-client/package.json
COPY web-admin/package.json ./web-admin/package.json
COPY supabase-playground/package.json ./supabase-playground/package.json
COPY packages/supabase-shared/package.json ./packages/supabase-shared/package.json

RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SENTRY_DSN
ARG SENTRY_DSN

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV SENTRY_DSN=$SENTRY_DSN

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build -w web-admin

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app .

EXPOSE 3001

CMD ["npm", "run", "start", "-w", "web-admin"]
