# Incremental delivery — authenticated Shipper API

This increment is **only files changed since the GreenPlus v2 handoff ZIP**, not a replacement of the entire project.

## Routes added to Web Admin

- `GET /api/shipper/deliveries`: requires `Authorization: Bearer <token>`, verifies the session, re-queries current `users`/`roles`, and returns at most 100 deliveries assigned to that shipper.
- `PATCH /api/shipper/deliveries/{orderId}/status`: accepts `{ "status": "picked_up" | "delivering" | "delivered" }`; checks ownership, validates transitions `assigned → picked_up → delivering → delivered`, and applies a compare-and-swap status check to limit concurrent duplicate transitions.
- Unauthorized and cross-shipper access must return an error without revealing other delivery details.

## Local setup

1. Configure Web Admin's existing Supabase variables and launch it on port 3001.
2. Set `GREENPLUS_SHIPPER_API_BASE_URL=http://localhost:3001/api` in `web-shipper/.env.local`.
3. Launch Shipper web on port 3002. For this transitional UI, provide a valid shipper session access token manually. **Do not deploy the manual-token UI as a production login flow.**
4. Run `node --test tests/*.test.mjs web-shipper/tests/*.test.mjs` from the repository root. Browser E2E and actual Supabase integration tests still require dependencies and a seeded test environment.

## What is NOT done

- No live Supabase or browser tests were run; the security tests are static structural checks, not proof of authorization effectiveness.
- No change to current shared-schema migration or RLS: phase-A tenant isolation remains incomplete. Queries currently restrict by `employee_id`; production needs verified store membership and order/store constraints, and RLS where appropriate.
- The legacy Web Admin `/api/deliveries` endpoints are not hardened by these shipper routes; they require their own authorization review.
- No proof-of-delivery upload, OTP, COD settlement, background GPS, or reliable push notifications yet.
- Current custom session tokens are verified by the existing AuthService; review token expiry/revocation before public deployment.

## Manual security acceptance checklist

- Unauthenticated request → 401.
- Customer/Admin bearer token → 403 (unless legitimately assigned shipper role).
- Shipper A sees only A's assignments; request to mutate Shipper B's order → 404.
- Skip a status (assigned → delivered) → 409; repeat same step → 409.
- Two concurrent updates for the same step: at most one succeeds.
- Suspended/banned shipper cannot read orders.
- Confirm no sensitive token or service-role key is exposed in browser response, telemetry, or logs.
