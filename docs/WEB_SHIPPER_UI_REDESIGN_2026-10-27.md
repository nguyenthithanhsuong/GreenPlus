# GreenPlus Web Shipper — UI consistency pass

## Scope

Pure Web Shipper frontend update. No Supabase migrations, environment variables, extra npm dependencies or modifications to Web Admin/Client.

- Replace separate page shells with one responsive `ShipperShell` for orders, lookup and profile.
- Unify spacing, color, typography, cards, buttons, status badges, icons and mobile/desktop navigation.
- Stabilize page layout with `scrollbar-gutter: stable` and `overflow-y: scroll`, so History tab does not shift the page when its scrollbar appears/disappears.
- Stabilize login form with a fixed 84px feedback region; long API errors scroll inside that region.
- Standardize result/map/sign-out dialogs via shared modal with close/Escape support.
- Expand profile with real contact information, account status, activity totals and help/security explanation. Activity counts reflect the **up to 100 deliveries** returned by the current server API; they are not lifetime analytics.
- Keep the existing per-shipper auth, delivery APIs, status flow, scoped map/GPS/OSRM demo untouched. No simulated profile/financial data.
- Add a consistent shipper favicon and static UI regression checks.

## Apply

1. Back up or commit your local edits.
2. Extract the patch at the root of `GreenPlus`, preserving paths.
3. Run `npm run dev:shipper` and open `http://localhost:3002`.
4. Test `/login`, `/`, `/scan`, `/profile`, and delivery map on desktop and mobile widths.
5. For code checks, run `npm run typecheck -w web-shipper`, `npm run lint -w web-shipper`, and `npm test -w web-shipper`. E2E needs `@playwright/test` installed in your workspace and a running local server.

## Known limitations

- Source was reconstructed from the latest available GreenPlus ZIP plus previously delivered Shipper patches. Changes made locally *after* those patches are not available here; review any overlapping local modifications when extracting.
- Node static/unit tests and TSX syntax parsing passed in the authoring environment; full Next.js compile, browser visual QA and Supabase login couldn't be performed there because dependencies/live services were not installed.
- Profile values are read-only; adding account edit/password reset APIs is out of scope.
- QR scanning requires a compatible browser and Camera permission. Manual lookup remains supported.
