# GreenPlus Customer TWA

Bubblewrap Android project for **the deployed `web-client` PWA** (not a Flutter application).

From the repository root, run `npm run mobile:client:preflight -- https://CLIENT_ORIGIN/`, then `npm run mobile:client:init -- https://CLIENT_ORIGIN/`. Keep package ID `com.greenplus.client` unless you also set `GREENPLUS_TWA_CLIENT_PACKAGE_ID` on the Client deployment. Set the SHA256 of the actual signing certificate as `GREENPLUS_TWA_CLIENT_SHA256`, redeploy, and run `npm run mobile:client:check -- https://CLIENT_ORIGIN/` before `mobile:client:build`. Signing keys and final APK/AAB are never committed. See `mobile/README.md`.
