# GreenPlus

Monorepo with two Next.js applications:

- `web-client`: customer-facing frontend
- `web-admin`: admin dashboard

## Project Structure

```text
GreenPlus/
	web-client/
	web-admin/
	package.json
```

## Prerequisites

- Node.js 20+
- npm 10+

## Install

Install dependencies once from the repository root:

```bash
npm install
```

## Development

Start each app from the root:

```bash
npm run dev:client
npm run dev:admin
```

Or run inside a specific app folder:

```bash
cd web-client
npm run dev
```

## Build and Lint

Run both apps in sequence:

```bash
npm run build
npm run lint
```

## Environment Variables

Use one shared file at repo root for values used by both apps:

```bash
.env.shared.local
```

You can use `env.shared.example` as a template.

Both `web-client` and `web-admin` load this file automatically through `next.config.ts`.

If you need app-specific overrides, add a local file inside each app:

- `web-client/.env.local`
- `web-admin/.env.local`

Values in app-level `.env.local` override the shared file.

Example shared variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```