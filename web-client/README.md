# web-client

Customer-facing Next.js app for GreenPlus.

## Run

From repository root (preferred):

```bash
npm run dev:client
```

From this folder:

```bash
npm run dev
```

## Env Vars

Set these in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_WEB_ADMIN_URL=http://localhost:3001
NEXT_PUBLIC_WEB_SHIPPER_URL=http://localhost:3002
AUTH_HANDOFF_SECRET=choose-a-long-random-secret
```
