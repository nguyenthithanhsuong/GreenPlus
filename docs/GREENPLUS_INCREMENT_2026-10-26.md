# GreenPlus incremental review — 26/10/2026

This changes-only handoff was compared byte-by-byte against `GreenPlus(1).zip` uploaded in the same conversation. It does **not** contain the original project or secrets.

## Implemented in this increment

- Web Shipper: login screen and server-to-server login proxy, HTTP-only SameSite cookie, server-side session check/profile, logout, dashboard connected to assigned deliveries, status transition controls, map link; QR/manual order lookup checks the shipper's assigned list. No longer requires manually pasting tokens in the browser.
- Web Admin: separate Admin/Manager/Employee navigation and page guard + role-aware middleware policy. Admin: dashboard, users, roles, Green Creator, stores and profile. Manager: dashboard, employees belonging to assigned stores, operational modules, Green Creator, reporting, profile. Employee: dashboard, suppliers, products, categories, batches, inventory, prices, orders, complaints and profile.
- Web Admin manager-users API: revalidates server-side actor, limits list to employees for owned/assigned stores; restricts creation to employee roles in owned stores; validates update target; blocks manager role/store edits and deletes. Store listing is filtered for managers. Requires `store_members` migration and `stores.manager_id` data.
- Web Client: active-store discovery, selector with optional geolocation, nearest-store suggestion by haversine distance, persistent selection, store-context propagation through major customer commerce fetches. Categories GET additionally scopes by `store_id`.
- Logging: removed raw credentials/hash prints in Admin Auth; dropped client-visible BetterStack tokens, reduced duplicate middleware telemetry, redacted log context fields, simplified Sentry exception path.
- Auth: existing `gpv1` HMAC session validation now rejects tokens older than eight hours.
- Added pure Node tests for navigation/API role matrix and nearest-store algorithm.

## Run

- Extract into GreenPlus root, preserving paths. Review modified files before overwriting.
- Copy `GREENPLUS_SHIPPER_API_BASE_URL=http://localhost:3001/api` into `web-shipper/.env.local` and set backend session secret and database credentials in the existing Web Admin environment.
- Use `npm ci` with working package registry, then start `npm run dev:admin`, `npm run dev:client`, `npm run dev:shipper` in separate terminals.
- Node test command: `node --experimental-strip-types --test tests/*.test.mjs web-shipper/tests/*.test.mjs`.
- Typecheck/build (not verified in this environment): `npm run typecheck`, `npm run build`.
- Verify with real manager/employee/shipper users and at least two separate stores before deployment.

## Known incomplete items — important

1. **Tenant isolation is NOT production-ready:** many existing Web Admin business repositories/handlers (products, orders, inventory, prices, suppliers, batches, etc.) still use the service-role Supabase client without consistent `store_id` filtering and write ownership checks. Role-based middleware cannot replace DB-level RLS or row-level checks. Do not deploy multi-store administration as secure until these endpoints are refactored and tested with two stores.
2. Dashboard business analytics for Manager/Employee can still aggregate unscoped records via legacy facades. Treat as a prototype until tenant-scoped repositories are implemented.
3. The Shipper transition only covers `assigned → picked_up → delivering → delivered`. It has no accept/reject assignment, COD reconciliation, evidence photos/OTP, location tracking, push or optimized navigation. The scan screen matches order IDs against assigned orders; it does not verify an authenticated QR signature.
4. Web Client store propagation is included for major Web commerce frontend fetches, but individual pages and API providers that do not use `storeFetch` need further store-scope review. The old shopping cart state may still contain a previous store's items; product/price validation must be performed at checkout server-side.
5. GPS recommendation is based on straight-line distance, not route distance or shipping fees. Permission to use device location is user-controlled; no external Maps API key is needed here.
6. Admin login persists the custom session in the legacy state store; although the Shipper uses HttpOnly cookies, the Admin and Customer auth/session architecture still merits a separate session-storage review. Existing login code supports legacy plaintext password upgrades; password migration policy should be addressed separately.
7. No actual Supabase migration was applied and none is included. No UI/browser tests, real DB integration tests, full typecheck or production build were successfully run; dependency installation hung in this environment.
8. BetterStack/Sentry changes are static hardening only. Verify DSNs, outbound network, log delivery, and retention in your deployment. `BETTER_STACK_SOURCE_TOKEN` must be server-only, never `NEXT_PUBLIC_*`.

## Verification performed

- 15/15 Node tests passed using experimental TypeScript type-stripping.
- Syntax-only transpilation of 550 TypeScript / TSX files: 0 errors.
- All relative imports in web-admin, web-client and web-shipper resolved in the extracted tree.
- These are **not** equivalent to full Next.js compilation, browser tests or end-to-end security verification.

## Priorities for next increment

1. Make store scoping mandatory in every Web Admin repository and mutation, enforce manager/employee scope on the server, add two-tenant RBAC negative tests and database constraints/RLS.
2. Finish Shipper assignment flow, COD, proof of delivery, real-time events and push notifications, with real database integration tests.
3. Finish Customer end-to-end store selection/cart/checkout switch handling and distance-fee calculation based on map/provider routing.
4. Full `npm ci`, ESLint, typecheck, Next.js build, Playwright and deployment smoke test on a sandbox environment.
