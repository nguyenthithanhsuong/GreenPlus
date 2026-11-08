# GreenPlus v2 — Mobile PWA/TWA release and architecture review

**Source inspected:** `GreenPlus(4).rar` + the previously validated 2026-11-07 root-artifacts/port cleanup, before these mobile changes. **Decision:** Client & Shipper ship as **Next.js PWA + Android TWA**, replacing planned Flutter delivery. **Status:** code-level mobile hardening delivered, full signed Android release and backend use-case completion **not verified**.

## 1. What is implemented in this delivery

| Mobile release concern | Before | This delivery | Verification |
|---|---|---|---|
| PWA metadata/icons | Both apps already have 192/512/maskable icons and manifest | Preserved; checked physical PNG dimensions 192/512 | Read-only file inspection + unit |
| Install affordance | Always floating on desktop, even without real install eligibility | Android/iOS mobile fallback; real `beforeinstallprompt` button only when browser offers it; dismissible | Static/runtime inspection; physical device still needed |
| Offline | Generic offline page only, safe navigation fallback | Retained no-private-data policy; explicit offline warning | Service worker event simulation |
| Updates | `skipWaiting()` executed during installation unconditionally | New worker waits; in-app update button only when active client exists; reload after user approval | Service worker simulation and TSX review |
| Cache security | No API response caching | Explicit unchanged policy + SW cache header `no-cache, no-store`; scoped cache-version cleanup | Node tests |
| TWA | Bubblewrap CLI wrapper, hard-coded assetlinks package ID | Strict HTTPS/mobile release preflight; verify manifest PNGs, SW MIME/cache, offline HTML and Android DAL; optional configured package ID | Node unit tests with mocked HTTP 200/302/404 |
| Shipper QR | `BarcodeDetector` or manually enter order code | Native detector + `jsQR` fallback for camera; read QR from local photo; 8 MB cap; no image upload; still lookup only assigned orders | Source assertions; Android camera/photo needed |
| Client QR | `jsQR` and camera functionality already present | Preserved | Source inspection |
| Flutter | Old starter code looked like selected implementation | Marked obsolete; not shipped or compiled | Documentation |
| Build artifacts | Root-oriented cleanup and ZIP script | Preserved | Existing cleanup tests |

This delivery **does not** generate signed APK/AAB: actual HTTPS domains, Bubblewrap/Android tools, certificate fingerprint, app signing, Play Console and physical devices are required. A 200 response from `/manifest.webmanifest` does not prove Android installability or trusted fullscreen launch. A `Create shortcut` menu item is not by itself proof of WebAPK installation.

### Production URLs / expected endpoints

- Client: `https://YOUR-CLIENT-DOMAIN/` → `/manifest.webmanifest`, `/sw.js`, `/offline.html`, `/icons/icon-192.png`, `/icons/icon-512.png`, `/.well-known/assetlinks.json`.
- Shipper: `https://YOUR-SHIPPER-DOMAIN/` → the same paths on **its own origin**.
- Local for web testing: Client `http://localhost:3001`, Shipper `http://localhost:3002`, Admin `http://localhost:3000`; Android TWA **cannot trust a localhost deployment** as published origin.

### Run these commands before push

```powershell
npm ci
npm run test:release:static
npm run typecheck
npm run lint
npm run build
```

When HTTPS deployments are ready:

```powershell
npm run mobile:client:preflight -- https://YOUR-CLIENT-DOMAIN/
npm run mobile:shipper:preflight -- https://YOUR-SHIPPER-DOMAIN/
# Initialize Bubblewrap (first time only), sign, set GREENPLUS_TWA_* SHA256 envs, redeploy
npm run mobile:client:check -- https://YOUR-CLIENT-DOMAIN/
npm run mobile:shipper:check -- https://YOUR-SHIPPER-DOMAIN/
```

`preflight` checks PWA HTTP assets but cannot claim a device install. `check` verifies Android Digital Asset Links (with a real signing fingerprint) after signing. Do not publish `GREENPLUS_TWA_*_SHA256` as a `NEXT_PUBLIC_*` setting; the fingerprint itself is public but the server configuration should remain consistent.

## 2. Manual acceptance matrix (must be completed on actual phones)

| Test | Expected | Result |
|---|---|---|
| Chrome Android PWA install | Installation option when browser/device supports it; standalone launch without website tabs | ☐ Pending |
| Safari iOS installation | Add to Home Screen; web app opens in standalone mode where supported | ☐ Pending |
| In-app update | New deploy offers update after current work is complete, no forced reload mid-order | ☐ Pending |
| Offline Client | `/offline.html` for navigation; checkout/API cannot create an order without connection | ☐ Pending |
| Offline Shipper | No false `delivered` success offline; status only changes after confirmed server response | ☐ Pending |
| Client camera QR | Ask for camera permission on user action; decode valid traceability QR | ☐ Pending |
| Shipper camera QR | Scan with native detector or jsQR fallback; no permission → manual entry/photo | ☐ Pending |
| Shipper image QR | Select photo from gallery; local decode; only assigned orders revealed | ☐ Pending |
| Shipper map | Order at GreenPlus B uses B's coordinates, not GreenPlus A's; GPS is optional/explicit | ☐ Pending |
| Shipper delivery | `deliveries=delivered` and `orders=completed` atomically, refresh Admin & Client | ☐ Pending |
| Authentication | Login/logout, expired session, role/store ownership; no private cache after logout | ☐ Pending |
| TWA APK | Signed, DAL verified with exact package and signing cert; no browser address bar | ☐ Pending |
| TWA AAB via Play | Play App Signing fingerprint verified; update from store works | ☐ Pending |
| Push, background GPS, COD/proof | Only claim complete after provider, Android behavior, server API and device testing | ☐ Open feature |

## 3. Architecture / design pattern audit (grounded in repository source)

### Positive architecture choices

- **Separate frontend workspaces** `web-admin`, `web-client`, `web-shipper`, with npm workspaces and an explicit shared package. This isolates Shipper routing/session; all three still share design and domain contracts imperfectly.
- **Layered modules** in `web-admin/backend/modules/*`: Route → Facade → Service → Repository for category, supplier, price, product, delivery etc. This is a real, useful Facade/Repository application for complex use cases.
- **State**: `web-admin/backend/modules/delivery-tracking/states/delivery-status.state.ts`, `web-client/backend/modules/orders/states/order.state.ts`. Enforced transitions are better than scattered conditional labels.
- **Strategy/Adapter/Registry**: `web-admin/backend/modules/delivery-tracking/strategies/delivery-status.strategy.ts`, `packages/tenant-routing/registry.mjs`, `packages/tenant-routing/postgrest-adapter.mjs`. Tenant registry rejects arbitrary storage targets by design; persistence routing is separated from UI.
- **Contract tests** are extensive, with Docker transaction tests across Regular, Pro A/B and Enterprise A/B using rollback.
- **Server-side secrets**: Docker gateway key and Supabase service-role key are not intentionally exposed to mobile clients; PWA caches only generic offline assets.

### Issues to resolve before AI assist or production DB cutover

| Priority | Evidence / concern | Recommended correction |
|---|---|---|
| **P0** | `web-admin/backend/modules/delivery-tracking/observers/delivery-tracking.observer.ts`: `DeliveryTrackingAuditObserver.update` is currently a **no-op** (`void event; return Promise.resolve()`). An Observer class **does not mean durable audit exists**. | Log sensitive operations in the same DB transaction (or reliable outbox), then Observer for noncritical notifications. Add audit persistence tests. |
| **P0** | Latest archive has Supabase migrations **0001–0015** only. Earlier `0016` RPC patch was discussed, but this source cannot confirm it is present/applied. Admin delivery facade still invokes a conditional after-write order fallback. | Compare remote migration history and the repository HEAD; don't blindly reapply. Establish atomic order/delivery transition and test on actual Supabase database. |
| **P0** | `web-client` and `web-shipper` still use Supabase production logic. Docker switch is **Admin sandbox scope**, not a three-app production data-plane cutover. | Create tenant-authenticated storage adapter across all three frontends and full schemas before production Docker switch; never fall back silently across providers. |
| **P0** | The document **Yêu cầu nâng cấp hệ thống**, section III, chooses **Shared DB + Shared Schema + store_id/RLS**, but the earlier proposal describes **Database-per-Tenant** and Docker sandbox implements a hybrid three-tier topology. | Record an approved architecture change: either core shared-schema and 3-tier as extension, or amend the requirements to formally allow hybrid; update ERD/migrations/demo story. |
| **P1** | ~31 facade classes and ~32 strategy-related files/classes appear under Admin+Client modules; some Strategies perform only `trim` + length validation (`categories/strategies/category-name.strategy.ts`). | Keep patterns where there are genuine varying algorithms; simplify single-implementation validation strategies into plain reusable functions during a targeted refactor. No risky mass rewrite now. |
| **P1** | Facades frequently write data, then `subject.notify(...)` outside DB transaction (`suppliers/facades/supplier-management.facade.ts`, delivery facade). If notify fails, business mutation already succeeded. | Distinguish transactional audit from best-effort post-commit side effects; outbox with retry/idempotency for notifications. |
| **P1** | `mobile/customer_app` and `mobile/shipper_app` still contain obsolete Flutter skeletons, while selected mobile implementation is PWA/TWA. | Archive/remove obsolete Flutter starters once collaborators confirm no active branches depend on them. No Flutter-only functionality should be counted as delivered. |
| **P1** | Many Client/Admin modules still call Supabase `.from(...)` directly. Shared routing is not yet universal. | Inventory query paths and gradually move per-domain repository contracts to an authenticated, tenant-scoped adapter before AI suggestions modify pricing/promotions. |
| **P1** | Swagger UI/OpenAPI routes exist (`/api-docs`, `/api/openapi`) behind `ENABLE_API_DOCS=true`, but route annotation coverage is incomplete. | Add accurate API schemas, parameters, auth/error responses; validate returned OpenAPI JSON in CI, not just route existence. |
| **P2** | Application code and release configuration mix `web-admin/frontend`, `web-client/frontend`, `web-shipper/src/frontend` and Next `src/app`. | Align conventions module by module, not with a high-risk global rename. Use bounded contexts and clear package exports. |
| **P2** | Source doc `docs/GREENPLUS_PWA_TWA_LOCATION_2026-10-27.md` still references older port assignment/Flutter background. | Treat this document + `mobile/README.md` as current PWA/TWA release source; update outdated archival docs during final dissertation revision. |

**Pattern assessment:** More patterns ≠ more maintainability. Domain/state and storage registry are appropriate; trivial validation strategies and no-op Observer classes provide little value or potentially misleading assurance. Prioritize correctness, tenant isolation, durable audit and testable contracts rather than adding Builder/Decorator/Command/Template Method everywhere for the report.

## 4. Remaining functional scope versus the approved use-case specification

The user-approved mobile replacement changes the implementation **medium**, not necessarily all business use cases. Existing web UIs provide login/QR/orders/shipper scanning/map/profile, but the following cannot be considered complete based solely on this source snapshot:

- **Push notifications** for customer/shipper: FCM or standards-based Web Push, server device subscriptions, authenticated opt-in/out, retry and delivery receipts.
- **Real-time background courier GPS** and multi-stop optimization: PWA/TWA cannot promise arbitrary background location updates like a dedicated native Android service. Foreground route/location works; specify fallback/permissions and product requirement for background mode.
- **Delivery proof and reconciliation**: OTP/photo proof, failed delivery reasons, COD collection/reconciliation, cross-role realtime updates. Requires DB schema, storage security and audit.
- **Customer loyalty/voucher checkout**, promotions, subscription, configurable shipping pricing and payment provider idempotency: separate backend/integration milestones.
- **OAuth/2FA/admin security**, audit logging, AI inventory and AI chatbot: are not completed by PWA packaging.
- **Full Docker runtime**: current 3-tier sandbox passes infrastructure checks in user-provided logs, but Client/Shipper data paths are not migrated to it. The Admin switch should not imply those mobile apps run on Docker.

## 5. Recommended next stage: AI assist, with safe entry criteria

Proceed to **AI-assist foundation** in controlled slices after mobile acceptance. Recommended sequence:

1. **Mobile acceptance gate** from section 2: two HTTPS domains and 2 physical Android app installations, service worker update/offline, auth, QR/photo, GPS, delivery confirmation and no tenant leak. Block “ready for Play” until SHA256 + signed APK/TWA verification.
2. **Back-end integrity gate**: reconcile `0016` + production DB migrations and order/delivery atomicity, verify approved tenancy architecture; do not run AI pricing against mock Docker data unknowingly.
3. **AI inventory input contracts**: store-scoped, read-only batches, stock, expiry and order history, timestamp/provenance; deterministic low-stock/near-expiry baseline before ML.
4. **Recommendation service**: `AI suggestions → pending manager approval → audited promotion`, never auto-apply to checkout until validated. Record model/version, evidence and confidence; prevent cross-tenant data leakage.
5. **Chatbot and GreenCreator**: permission-scoped retrieval, no service-role key on device, explicit LLM fallback, rate limits, redacted logs and human escalation.
6. **Release/E2E/observability**: GitHub gates, deployed endpoint probes, Sentry/Better Stack samples and Android regression; update thesis traceability matrix by UC and evidence.

**Scope of the mobile patch:** PWA/TWA installation workflow, secure updates/cache, Android release validation and Shipper QR fallback. It does not alter production Supabase migrations, Docker schemas, payment or authentication secrets. No unsafe cutover or fake “mobile finished” claim.
