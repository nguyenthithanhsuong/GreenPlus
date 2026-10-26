# GreenPlus lint / Next.js client-component hotfix (26/10/2026)

This archive is incremental **relative to `GreenPlus_2026-10-26_changes_only.zip` already applied to the original `GreenPlus(1).zip`**. It contains only new or modified paths from this lint hotfix.

## Symptoms from user's local output

- Web Admin `lint-fix`: **0 errors, 70 warnings**.
- Web Client `lint-fix`: **1 error, 82 warnings**.
- Fatal lint error: `react-hooks/immutability`, `StoreSelector.tsx`, call to `choose` reported before declaration.
- Several product, checkout and orders Client Components had an import **before** `"use client"`; this is invalid as a Next.js Client Component boundary and also caused `no-unused-expressions` warnings.

## Changes

1. Reordered the `"use client"` directive to the first statement in 11 Web Client components.
2. Rewrote `StoreSelector.tsx`: stable `choose` and `recommend` callbacks declared in safe order, correct Hook dependencies, explicit location permission request only after user click, auto-recommendation only when permission is already granted, and preservation of a valid manual selection.
3. Cleaned up specific React dependency issues in admin and client modules. No wholesale disabling of lint rules.
4. Removed unnecessary `debugSteps` console logging and stale unused import from dashboard.
5. Added targeted regression tests for directive placement and nearest-store selector structure.

## Verification in artifact workspace

- TypeScript transpilation syntax check: 550 TS/TSX modules, 0 diagnostics (not a full typecheck).
- Node tests: run `node --experimental-strip-types --test tests/*.test.mjs web-shipper/tests/*.test.mjs` in project root.

## Run on your machine

```powershell
npm run lint -w web-client
npm run lint -w web-admin
npm run typecheck
npm run build
```

Warnings about `<img>` and remaining unused variables can still appear; they don't by themselves cause the previous exit code 1. **The commands above still need to be run on a machine with dependencies installed**. TypeScript syntax checks and Node tests do not establish a successful Next.js build.

Do not run `npm run check-all` just to validate this patch: it automatically reformats and edits a much larger portion of the repository. Review the diff first.
