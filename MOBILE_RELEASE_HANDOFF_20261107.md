# GreenPlus v2 — Mobile release handoff (2026-11-07)

This is a **root-relative changes-only patch** built on the previously supplied `GreenPlus(4).rar` + `GreenPlus_4_Audit_Cleanup_RootArtifacts_Fix.zip` state. It is **not** a signed Android APK/AAB and does not modify production Supabase/Docker data.

## Apply

1. Back up/commit your current repository. Extract the patch ZIP into the `GreenPlus/` root with overwrite enabled. Do **not** delete `.env`, Docker volumes or Supabase migration history.
2. Install dependencies to include Shipper's existing `jsqr` library now declared directly in its workspace: `npm ci`.
3. Run:

```powershell
npm run test:release:static
npm run typecheck
npm run lint
npm run build
npm run dev:web
```

4. Check from mobile browser: `http://localhost:3001/install` for Customer and `http://localhost:3002/install` for Shipper (for local UX only). **Real install testing requires HTTPS deployment.**
5. Verify live PWA assets on Vercel:

```powershell
npm run mobile:client:preflight -- https://YOUR-CLIENT-DOMAIN/
npm run mobile:shipper:preflight -- https://YOUR-SHIPPER-DOMAIN/
```

6. Test both apps on Android Chrome and iOS Safari. For Shipper, test camera QR, QR photo upload fallback and manual order code search, plus foreground GPS and assigned-store pickup location. For Customer, test QR camera, store switch, cart and checkout. Disable networking and confirm no fake success or stale private data.
7. Only after signed Bubblewrap Android projects exist, configure `GREENPLUS_TWA_CLIENT_PACKAGE_ID`, `GREENPLUS_TWA_SHIPPER_PACKAGE_ID` if non-default, and `GREENPLUS_TWA_CLIENT_SHA256`, `GREENPLUS_TWA_SHIPPER_SHA256` in the respective Vercel projects. Redeploy and run `mobile:client:check`/`mobile:shipper:check`. Inspect trusted fullscreen launch on real Android.

## Implemented

PWA install prompt UX, offline/update messaging, user-controlled service worker activation, uncached SW headers, asset/Android DAL release check, new Shipper QR-camera fallback and local QR-photo decoding, scripts/CI shared release-validation library, updated PWA/TWA documentation and architecture review.

## Verification here

- Node root tests: **209/209 passed**.
- Shipper Node tests: **31/31 passed**.
- CI validator: **PASS**.
- Modified TS/TSX files: parsed successfully with TypeScript 5.8.3. JS scripts passed `node --check`.
- **Not executed here:** `npm ci`, actual Next.js typecheck/build/lint, live Vercel probes, device permission/installation, Bubblewrap signed APK/AAB. Those require working dependencies, deploy credentials/domains and hardware.

## Do not conflate these independent milestones

The selected Mobile implementation **PWA/TWA replaces Flutter only**. It does not automatically add FCM push, background GPS, OTP/photo proof/COD reconciliation, true Docker Client/Shipper cutover, or AI. The full list of missing functional requirements and pattern assessment is in `docs/GREENPLUS_MOBILE_RELEASE_AND_ARCH_REVIEW_20261107.md`.
