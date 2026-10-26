# GreenPlus Flutter preparation (not a compiled app)

This directory contains **two initial Flutter application skeletons**, with separate entry points and a shared API contract. The source ZIP did not include existing Flutter applications. Platform project files must be generated with `flutter create .` inside each app on a machine with Flutter SDK.

## Local setup

1. Install Flutter SDK and Android Studio. `flutter doctor` must pass.
2. `cd mobile/customer_app && flutter create . && flutter pub get && flutter run`
3. `cd mobile/shipper_app && flutter create . && flutter pub get && flutter run`
4. Configure app authentication and API base URL using `--dart-define` before any real API traffic. Demo screens do **not** call production endpoints.

## Current limits

- No shipping/order backend binding, auth flow, camera, FCM, location permissions or realtime integration provided.
- Do not hard-code service role keys into mobile apps. Use short-lived user access tokens and server authorization.
- Store isolation is NOT complete in Supabase migrations 0004–0010; don't deploy multi-store without additional rollout.
