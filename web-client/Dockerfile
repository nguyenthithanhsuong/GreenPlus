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

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build -w web-client

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app .

EXPOSE 3000

CMD ["npm", "run", "start", "-w", "web-client"]
