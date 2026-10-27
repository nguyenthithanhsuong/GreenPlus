# GreenPlus – PWA/TWA + verified delivery coordinates (changes only)

## Overview

- Web Client remains Next.js :3000; Web Shipper remains independent Next.js :3002; Web Admin remains :3001.
- **No Flutter UI rewrite.** A PWA uses exactly the live Next.js UI. Android TWA is a wrapper which opens each *deployed HTTPS website* in a verified full-screen browser context.
- `mobile/client-twa` and `mobile/shipper-twa` are Bubblewrap *project workspaces*, not additional web servers. Legacy `mobile/customer_app` and `mobile/shipper_app` Flutter starters are left untouched.
- Each web app has an installable manifest, 192/512/maskable brand icons, theme metadata, a service worker, and an explicit offline page. The service worker caches **only the generic offline page and icons**. It does **not cache logged-in screens or API responses**.
- `/.well-known/assetlinks.json` is generated on each deployed site using a *public SHA-256 signing certificate fingerprint* in the shared root `.env`/production environment. Do not put a keystore or passwords in `.env` or Git.

## Important limitations before calling this production-ready

1. **No signed APK/AAB is shipped.** Generating an Android TWA needs your actual public HTTPS Client and Shipper URLs, Bubblewrap/Android SDK/JDK, a signing certificate, and a device. Verification cannot be completed with `localhost`, and without `assetlinks.json` Android shows a browser custom tab.
2. PWA/TWA is **online-first**. Checkout, login, deliveries, and GPS routing need a reachable server. Website updates change the TWA UI after deploying Next.js; Android-native app IDs/signatures still need new APK builds when changed.
3. **Photon OpenStreetMap geocoding** defaults to its publicly available *demo* instance, with a queued approx. 1 request/sec process limit and a short in-memory cache. It is not a guaranteed production service. For live usage, configure `GREENPLUS_GEOCODER_ORIGIN=https://your-self-hosted-photon.example`, or replace the adapter with a service offering explicit SLAs. Never expose the service-role key to the browser. **The typed address is sent to the geocoding host**; users should know this before confirming. No autocomplete is sent per keystroke.
4. A successful geocode means a street-level coordinate was found in Vietnam, **not** confirmation the courier can legally/accessibly deliver there or whether the selected store covers that address. Administrative delivery-zone restrictions are not configured in the original DB. Human review is still important.
5. Existing orders/users with NULL coordinates remain unchanged. The Shipper map falls back to the existing manual pin for legacy orders. New customer profile/store/shipping writes validate the address on the **server** rather than accepting arbitrary client lat/lon.
6. The legacy `checkout_cart` RPC has no coordinate parameters. Its result is updated with coordinates in a second **store+user+order-scoped** DB call. In the rare event that this second call fails, checkout may have created an order already. The checkout idempotency key remains essential. A fully atomic version should extend the checkout SQL RPC after verifying production function definitions.

## Apply / migrate / test in VS Code

1. Backup/commit the current repo; extract this changes-only ZIP into the repo root, preserving paths. **Do not overwrite your `.env`.**
2. Review `supabase/migrations/0012_verified_delivery_coordinates.sql`. You said `0011` has already been pushed; therefore this new migration is `0012`. It only adds nullable numeric coordinates to users/orders and paired-coordinate constraints, with no blind backfill.
3. `npx supabase migration list`, `npx supabase db push --dry-run` – only `0012` should be pending. Verify a database backup and test `npx supabase db reset` on a local test database (it destroys the local DB), then run `npx supabase db push` **after** review. Do not use `db reset --linked`.
4. From root: `npm install`, `npm run typecheck`, `npm run build` on your machine, and `node --experimental-strip-types --test tests/delivery-location.test.mjs tests/pwa-mobile-static.test.mjs tests/migration-static.test.mjs`.
5. `npm run dev:client` or `npm run dev:shipper`. Test forms on localhost; service workers deliberately register only in production. For installability test, deploy each app over HTTPS and check `https://YOUR_DOMAIN/manifest.webmanifest`, `/sw.js`, `/icons/icon-512.png`, `/offline.html`.
6. **Address**: enter a detailed street/house address with district/province. On the Customer Profile screen, click **Xác minh địa chỉ và tọa độ** and inspect the result before saving. The server repeats geocoding and stores `users.latitude/longitude`. Checkout validates `orders.delivery_address` again and stores `orders.delivery_latitude/longitude`. In Admin Store Management, enter the address, ward/district/city and click **Xác minh địa chỉ...**; saving rechecks on the server. In the Shipper profile, verify the *Shipper's contact address* before saving; shipment destination is read from the **order**, never from Shipper's own profile.
7. If Photon cannot identify an accurate street or it is down, saving is rejected instead of pretending success. Review the text rather than submitting the wrong point. To support districts/wards without sufficiently detailed OSM coverage, deploy a separate supported geocoder or add a verified human map-pin workflow.

## Build two TWA APKs (Windows / VS Code, without Android Studio IDE)

Requirements: Node, Java/Android command-line SDK/Build Tools, a device for testing, internet access for Bubblewrap. A production-compatible Chrome browser must be installed on the phone.

1. Deploy Web Client at **https://client.your-domain.example/** and Web Shipper at **https://shipper.your-domain.example/**. Separate HTTPS origins are recommended; they must route to the correct respective Next.js servers.
2. From the repo root:

   ```powershell
   npm run mobile:client:init -- https://client.your-domain.example/
   npm run mobile:shipper:init -- https://shipper.your-domain.example/
   ```

   Bubblewrap will create the native Android project. During prompts, use `com.greenplus.client` and `com.greenplus.shipper` as application IDs (or modify the assetlinks routes to match any intentional different IDs). Store signing keys **outside** Git, protect passwords, and retain the key for all future upgrades.
3. Obtain **SHA-256 fingerprint of the certificate used to sign the actual APK**:

   ```powershell
   keytool -list -v -keystore C:\SecureKeys\client.keystore -alias android
   keytool -list -v -keystore C:\SecureKeys\shipper.keystore -alias android
   ```

   Set `GREENPLUS_TWA_CLIENT_SHA256=AA:BB:...` and `GREENPLUS_TWA_SHIPPER_SHA256=CC:DD:...` (64 hexadecimal digits with colon separators) in the shared root `.env` for local preview and in the **production app environment** for the hosted web deployments. Restart/redeploy Next.js after updating them. The `assetlinks.json` endpoint must serve JSON on each origin and have the exact package ID and fingerprint. For a Play App Signing release, use the **Play app-signing certificate fingerprint**, not the local upload certificate.
4. Validate:

   ```powershell
   node scripts/mobile-twa.mjs client check https://client.your-domain.example/
   node scripts/mobile-twa.mjs shipper check https://shipper.your-domain.example/
   npm run mobile:client:build
   npm run mobile:shipper:build
   node scripts/mobile-twa.mjs client install
   node scripts/mobile-twa.mjs shipper install
   ```

   Check the signed APK, test launch screen, HTTPS, login/cookies, browser Android Back, camera, GPS permission, and switching between online/offline. If Android displays the browser bar, investigate the Android Digital Asset Links verification.

## Validation scenarios

- Customer with an empty/vague address cannot save verified location or place an order. A detailed located address shows latitude/longitude and can be saved; order copies verified coords after checkout.
- Admin can create/change Store only with verified address; latitude/longitude inputs are read-only display, server ignores supplied coordinates and recomputes them.
- Shipper can change personal address but cannot alter store, email, or role. Shipper map shows order drop-off from `orders.delivery_latitude/longitude` when present; old orders still permit a temporary pin.
- Sentry/Better Stack: This patch **does not change existing monitoring integrations**. Service workers never cache authenticated content.
- Multi-store isolation: This feature does not replace the separate tenant-scope audit. Continue authorization testing for all API routes before going to production.

## Official references

- Next.js metadata manifest: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
- Bubblewrap: https://github.com/GoogleChromeLabs/bubblewrap/tree/main/packages/cli
- Android TWA & Digital Asset Links: https://developer.chrome.com/docs/android/trusted-web-activity/quick-start
- Photon demo fair-use policy: https://github.com/komoot/photon
- OpenStreetMap tile usage: https://operations.osmfoundation.org/policies/tiles/
