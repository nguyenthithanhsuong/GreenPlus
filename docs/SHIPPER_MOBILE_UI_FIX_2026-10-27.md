# GreenPlus Web Shipper — Mobile-first UI restoration

Source baseline: `GreenPlus(3).zip` (uploaded on 2026-10-27). This is a changes-only patch; it does not contain the other apps or `.env`.

## Design compared with Web Client

Web Client's `frontend/shared/screen.styles.ts` defines a full-screen gradient `linear-gradient(160deg, #0f172a 0%, #115e59 55%, #10b981 100%)`, a white centered mobile canvas max-width `500px`, and `12px` outer gutters. Web Shipper now follows the same geometry and backdrop on **all viewport sizes**; it no longer switches to a 1240px-wide desktop workspace/sidebar. Its bottom navigation has the same centered max-width and uses the same icon+label pattern.

Changes:

- Common `ShipperShell` for order dashboard, QR/search, and profile; `InfoRow` reused in search and profile; common `Modal` and `StatusBadge` reused.
- Unified compact headers, green colors, cards, inputs, buttons and mobile bottom navigation.
- Body scrollbar gutter set to `stable both-edges` to reduce horizontal jumps when switching order tabs.
- Login is a mobile-centered form with stable feedback area (84px) on success/error.
- QR scanner and manual code entry are stacked vertically. Search detail, map, logout and delivery confirmation use one modal style (bottom sheet on small screens).
- Profile can edit **name, phone and contact address**, and change password. Email, role, status and store access remain server-controlled. No avatar upload or email change provided.
- Existing delivery API, map, GPS and polling unchanged. Shipper continues to run on port 3002 directly against its own backend and Supabase, with root `.env` unchanged.

## Profile APIs

- `GET /api/auth/me`: returns currently authorized Shipper profile incl. `address`.
- `PATCH /api/auth/me`: cookie-authenticated, same-origin, allows only `name`, `phone`, `address`, validates inputs and updates the current user row only.
- `POST /api/auth/change-password`: cookie-authenticated, same-origin, requires old password, hashes new password, and uses conditional update to avoid overwriting a concurrent password change.

Password changes do **not** revoke other already-issued Shipper sessions. This would need dedicated session revocation/versioning if required later.

## Sentry / Better Stack audit

The uploaded baseline's **web-shipper** contains no `@sentry` or `@logtail`/Better Stack dependency, SDK instrumentation files, or usage/reference in its application source/config. **web-admin** and **web-client** do have Sentry configuration and SDK references. No Better Stack integration was found in Web Shipper. This patch does not add observability services or keys.

## Local verification

1. Extract ZIP contents at GreenPlus root, preserving paths.
2. `npm run dev:shipper` and visit `http://localhost:3002`.
3. Check widths ~375px, 390px, 500px, 768px, 1366px: centered white mobile canvas, visible green gradient either side on desktop, consistent bottom navigation.
4. Switch order tabs (especially History), open/close QR result, map, confirm delivered and logout modals. Confirm no horizontal shift and no inaccessible buttons.
5. Edit profile name, phone, address. Refresh and ensure persisted. Check invalid phone and attempts to PATCH `role_id`, `email` or `store_id` are rejected.
6. Change password; verify old password fails and new password succeeds at next login.
7. `npm test -w web-shipper`, `npm run typecheck -w web-shipper`, `npm run lint -w web-shipper`.

Testing performed for this patch: 25/25 Node tests passed; 33 TS/TSX files passed TypeScript transpilation/syntax checks. Full Next.js build, true TypeScript typecheck, and a live-browser visual test were **not performed** in this environment. Test the flows locally before production deployment.
