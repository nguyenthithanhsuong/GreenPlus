# GreenPlus Mobile — PWA / Trusted Web Activity (decision 2026-11-07)

The two **production mobile frontends are the existing Next.js PWAs**, not Flutter:

| Mobile product | Web source | Android Bubblewrap workspace | Local dev |
|---|---|---|---|
| Customer | `web-client/` | `mobile/client-twa/` | `http://localhost:3001` |
| Shipper | `web-shipper/` | `mobile/shipper-twa/` | `http://localhost:3002` |

**PWA** is an installed web application; **TWA** is a separately signed Android APK/AAB that displays the live HTTPS PWA after Android Digital Asset Links verification. App data and auth remain served by the web backend. The Android wrapper cannot run offline checkout/delivery or provide native background GPS by itself.

The old `mobile/customer_app` and `mobile/shipper_app` directories are **obsolete Flutter prototypes**, kept for historical reference and excluded from the release. Do not run `flutter create` or ship them as the chosen Mobile implementation. They can be archived/removed independently after confirming no other student is using them.

## Mobile release workflow

1. Deploy the web apps on **two real HTTPS origins**, each serving its own manifest, icons, `/sw.js`, `/offline.html` and `/.well-known/assetlinks.json`. Don't use localhost URLs for signed TWA releases.
2. Perform read-only, pre-signing checks on the live PWAs:
   ```powershell
   npm run mobile:client:preflight -- https://YOUR-CLIENT-DOMAIN/
   npm run mobile:shipper:preflight -- https://YOUR-SHIPPER-DOMAIN/
   ```
   These verify HTTP resources and safe service-worker caching, **not** the install button/device.
3. Test installation on Chrome Android (PWA/WebAPK) and Safari iOS (Add to Home Screen); verify standalone launch, foreground camera/GPS, logout, offline/online recovery, app update prompt and no sensitive data cached offline.
4. To publish **Android TWA**, initialize each wrapper once:
   ```powershell
   npm run mobile:client:init -- https://YOUR-CLIENT-DOMAIN/
   npm run mobile:shipper:init -- https://YOUR-SHIPPER-DOMAIN/
   ```
   During Bubblewrap setup, keep the Android package IDs `com.greenplus.client` / `com.greenplus.shipper`, or configure `GREENPLUS_TWA_CLIENT_PACKAGE_ID` / `GREENPLUS_TWA_SHIPPER_PACKAGE_ID` on the respective deployed Next.js backend to match your chosen IDs. Protect the keystore outside Git.
5. Generate Digital Asset Links JSON using the **signing certificate** fingerprint, not an arbitrary hash:
   ```powershell
   npm run mobile:client:assetlinks -- AA:BB:...:ZZ
   npm run mobile:shipper:assetlinks -- AA:BB:...:ZZ
   ```
   The argument must be an actual colon-separated SHA256 fingerprint from `keytool -list -v -keystore ...`. The generated `mobile/*-twa/assetlinks.generated.json` is for review; publish the equivalent values as `GREENPLUS_TWA_*_SHA256` in the deployed web app environments, then redeploy. When using **Play App Signing**, also register the Google Play app-signing certificate (not just upload key).
6. Verify deployed Digital Asset Links and build the native wrapper:
   ```powershell
   npm run mobile:client:check -- https://YOUR-CLIENT-DOMAIN/
   npm run mobile:shipper:check -- https://YOUR-SHIPPER-DOMAIN/
   npm run mobile:client:build
   npm run mobile:shipper:build
   ```
   Finally install and inspect the signed builds on physical Android devices; Android showing a browser address bar is a TWA verification warning.

## Privacy and operations

- Service workers cache **only** the public offline shell and icons; never pages containing user data or `/api` responses.
- App updates wait for explicit user action instead of interrupting checkout/deliveries.
- The PWA is **online-first**. Offline means a generic explanation, not fake success, an order queue or cached customer PII.
- Camera QR and Shipper route geolocation require secure contexts and user permission. Android TWA does **not** guarantee continuous background GPS or FCM notifications.
- Production Flutter and PWA are materially different architectures. Update the original thesis proposal's Flutter wording to document the approved PWA/TWA substitution; the detailed use-case specification instead identifies the core tenant architecture as Shared Database + Shared Schema.

See `docs/GREENPLUS_MOBILE_RELEASE_AND_ARCH_REVIEW_20261107.md` for acceptance and architectural gaps.
