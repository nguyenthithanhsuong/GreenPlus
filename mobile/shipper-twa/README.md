# GreenPlus Shipper TWA

Bubblewrap Android project for **the deployed `web-shipper` PWA** (not a Flutter application).

From the repository root, run `npm run mobile:shipper:preflight -- https://SHIPPER_ORIGIN/`, then `npm run mobile:shipper:init -- https://SHIPPER_ORIGIN/`. Keep package ID `com.greenplus.shipper` unless you also set `GREENPLUS_TWA_SHIPPER_PACKAGE_ID` on the Shipper deployment. Set `GREENPLUS_TWA_SHIPPER_SHA256` to the actual signing certificate fingerprint, redeploy, then run `npm run mobile:shipper:check -- https://SHIPPER_ORIGIN/` before `mobile:shipper:build`. The browser requires foreground camera/GPS permissions; background delivery location tracking and proof-of-delivery are not provided by the TWA wrapper. See `mobile/README.md`.
