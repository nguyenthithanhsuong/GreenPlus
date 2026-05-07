# web-admin

Admin dashboard Next.js app for GreenPlus.

## Run

From repository root (preferred):

```bash
npm run dev:admin
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
SUPABASE_SERVICE_ROLE_KEY=...
AUTH_HANDOFF_SECRET=choose-a-long-random-secret
```
