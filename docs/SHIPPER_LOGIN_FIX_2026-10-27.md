# GreenPlus Web Shipper — Login fix / troubleshooting

## Findings

- `web-shipper/.env.local` from the provided project ZIP did not declare `GREENPLUS_SHIPPER_API_BASE_URL`.
- The previous Next.js login proxy defaulted to `http://localhost:3001/api` in development and caught all failures as the same `502 / Dịch vụ xác thực không khả dụng` error.
- Web Admin's development script runs on port **3001**, Web Shipper on port **3002**.
- The backend still requires a user with a current `roles.is_shipper = true` and `users.status = 'active'`. Credentials alone are not sufficient.

## Local setup in two VS Code terminals

From the GreenPlus root:

```powershell
npm run dev:admin
```

In another terminal:

```powershell
npm run dev:shipper
```

In `web-shipper/.env.local` **add** (keep any other existing settings):

```dotenv
GREENPLUS_SHIPPER_API_BASE_URL=http://localhost:3001/api
```

**Restart Web Shipper after changing `.env.local`.** Do not copy real credentials into an issue or chat.

## Confirm Web Admin is reachable, without sending real credentials

From the project root:

```powershell
node scripts/check-shipper-auth.mjs
```

Expected:
- `Health: HTTP 200 | JSON: true`
- `Shipper login route: HTTP 400 | JSON: true`
- `OK: Web Admin Shipper login endpoint is running and validates input.`

You can also call `Invoke-RestMethod http://localhost:3001/api/health`.

If the second endpoint returns HTTP 404, ensure the Web Admin project includes `web-admin/src/app/api/shipper/auth/sign-in/route.ts` and that you started Web **Admin**, not Web Client, on port 3001.

## Expected login error codes after this patch

- `SHIPPER_API_UNREACHABLE`: Web Admin is not running / wrong host/port / network blocked.
- `SHIPPER_API_TIMEOUT`: Web Admin did not respond within 12 seconds.
- `SHIPPER_API_SELF_REFERENCE`: URL points back to Web Shipper port 3002.
- `SHIPPER_API_ROUTE_MISSING`: Wrong backend URL or Web Admin route not deployed.
- `SHIPPER_API_REDIRECT`: API returned a redirect, commonly an incorrect middleware rule or login page.
- `SHIPPER_API_UPSTREAM_ERROR`: Web Admin returned 500/503. Look at the **Web Admin terminal** for the actual backend error; do not share secrets.
- `SHIPPER_AUTH_DENIED` (400/401/403/422): API rejected the credentials, account status, or Shipper role. Verify the account's role in Supabase rather than bypassing the role check.
- `SHIPPER_API_INVALID_RESPONSE`: API returned success but did not return a valid session object.

New errors report the stable `code` field in Network → `/api/auth/sign-in`; they never log the password or access token.

## Production

Set `GREENPLUS_SHIPPER_API_BASE_URL` to the **reachable HTTPS origin for deployed Web Admin** (or that origin with `/api`), e.g. `https://<your-web-admin-host>/api`. Do not use `localhost:3001` in production if Web Admin is deployed separately. Ensure HTTPS and that `AUTH_HANDOFF_SECRET` / `AUTH_SESSION_SECRET` is configured on Web Admin, since it signs the session tokens.

## Tests run

```powershell
node --experimental-strip-types --test tests/*.test.mjs web-shipper/tests/*.test.mjs
```

Result in patch environment: 38/38 PASS. Full Next.js build, TypeScript typecheck, and real Supabase login were **not run** in this environment (dependencies were unavailable); they should be executed in your VS Code project after applying this patch.
