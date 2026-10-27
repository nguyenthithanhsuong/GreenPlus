# GreenPlus Web Shipper — independent Next.js server, port 3002

## Architecture
- `web-client`: 3000 — own Next API routes.
- `web-admin`: 3001 — own Next API routes.
- **`web-shipper`: 3002 — own auth, profile, deliveries API and server-side Supabase client.**
- All three use the **same Supabase PostgreSQL data**; Web Shipper **does not need either other web app to be running**.
- No Web Admin endpoint or URL is used in the new Shipper routes.
- Supabase SERVICE ROLE key is **server-only**, never in browser or mobile application.

## Configure the Shipper app (Windows VS Code)
Copy the keys from the existing Web Admin environment **only into `web-shipper/.env.local`** (do not commit):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
SHIPPER_SESSION_SECRET=YOUR_UNIQUE_RANDOM_SECRET
```

Generate a unique secret in the terminal:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

The secret must have at least 32 bytes and remain unchanged across restarts; use a **different secret** from other apps if possible. Do not prefix sensitive keys with `NEXT_PUBLIC_`. Remove `GREENPLUS_SHIPPER_API_BASE_URL`; it is no longer used.

Install / run, without Web Admin running:

```powershell
npm install
npm run dev:shipper
```

Open `http://localhost:3002/login` and sign in with an **active GreenPlus `users` account whose `roles.is_shipper = true`**. This is the app's legacy custom email/password table, **not** Supabase Auth email/password. Old plaintext passwords are upgraded to PBKDF2 after valid login; existing PBKDF2 passwords work as is. No migrations are needed for these routes.

## Runtime API (all at localhost:3002)
- `POST /api/auth/sign-in` — creates signed, 8-hour HttpOnly SameSite=Lax Shipper cookie.
- `GET /api/auth/me` — validates cookie **and current database role/status**, returns profile.
- `POST /api/auth/sign-out` — clears cookie.
- `GET /api/shipper/deliveries` — only `deliveries.employee_id = session.user_id` **and active `store_members`**, plus consistency check `deliveries.store_id = orders.store_id`.
- `PATCH /api/shipper/deliveries/[orderId]/status` — requires own delivery, active store membership, order-store match, adjacent transitions and compare-and-swap conditional update.

**No browser service-role key**. No `user_id` or `store_id` supplied by browser is trusted.

## Tests
```powershell
npm run test -w web-shipper
npm run typecheck -w web-shipper
npm run lint -w web-shipper
```
For a basic manual check, **stop Web Admin and Web Client** and confirm:
1. Shipper login on port 3002 succeeds with an active Shipper account.
2. Customer/Manager account cannot sign in to Shipper.
3. `/api/auth/me` responds 401 without the cookie.
4. Shipper sees only own assignments; another Shipper's order cannot be updated.
5. `assigned → delivered` fails with 409; consecutive valid transitions succeed.

## Security limitations / pending work
- Existing database migrations must already have populated `store_id` consistently. Deliveries with null/mismatched `store_id` are **intentionally hidden** until fixed, not shown across tenants.
- Checks `store_members` for an active membership in the delivery store; Shippers with no active memberships intentionally see no orders. The migration must have backfilled or administrators must create the membership. Still verify the full role/membership matrix with integration tests.
- Stateless signed cookies cannot be revoked server-side until expiration (logout deletes the browser cookie). For production, add revocable sessions and distributed login rate limiting/lockouts.
- No live Supabase test, Next.js build, or browser E2E is claimed by this patch. Test with an isolated Supabase project before public deployment.
- Obsolete modules `src/lib/shipper-auth-upstream.mjs`, `src/lib/shipper-auth-upstream.d.mts`, `src/lib/delivery-api.mjs`, `src/lib/delivery-api.d.mts` are no longer imported by Shipper's runtime routes. They may be removed after confirming there are no other callers.
