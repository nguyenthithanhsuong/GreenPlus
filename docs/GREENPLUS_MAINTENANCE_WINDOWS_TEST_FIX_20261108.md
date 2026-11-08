# GreenPlus — Maintenance test/Windows process fix (2026-11-08)

## What the user log establishes

The cleanup reached the verification phase. On Windows, ESLint in all three workspaces completed with **zero errors**, and all three TypeScript typechecks passed. `test:release:static` failed in two **test harness fault-injection cases**; the cleanup runner then restored the 20 source files and the `mobile/shipper_app` folder. The optional `mobile/customer_app` folder was never moved because Windows reported `EBUSY`. The log does **not** establish that the full Next.js build or packaging passed.

## Root cause and changes

1. Both test callbacks in `tests/repo-maintenance.test.mjs` were matching POSIX path suffixes (`from.endsWith('mobile/customer_app')` and `from.endsWith('unused/b.ts')`). On Windows Node returns backslash-separated absolute paths. Consequently, fault injection never fired, the customer directory was actually moved, and the expected mandatory move rejection never happened. The updated tests normalize separators before matching and assert that the mandatory failure was injected.
2. `scripts/repo-maintenance.mjs` used `spawnSync('npm', ['run', ...], {shell: true})` on Windows. Recent Node versions warn about the potential for argument injection (`DEP0190`). The runner now invokes `cmd.exe` explicitly with `/d /s /c` and a strictly validated *single* `npm run <script>` command, with `shell: false`. On Unix it continues spawning `npm` directly with `shell: false`. Only code-defined npm script names are accepted by this path.
3. Added cross-platform path-matching tests and a test for Windows command construction and rejection of unsafe args.

No production API, database, Docker volumes, `.env`, PWA or business logic were modified. No dependency install is needed.

## Apply and verify on the user's Windows computer

Extract the changes-only ZIP over the **root** of GreenPlus (not over individual workspace folders), then run:

```powershell
# A clean state is expected after the automatic rollback shown in the previous log.
git status --short

# Verify the previously failing fault-injection tests first.
node --experimental-strip-types --test tests/repo-maintenance.test.mjs

# Run repository tests without moving source files.
npm run test:release:static

# Recommended first: clean source, but do not touch optional Flutter prototypes.
.\scripts\maintain-greenplus.ps1 -Apply -CleanGenerated
```

If you also want to attempt removal of the obsolete Flutter prototypes, after the first successful pass (or instead of it), use:

```powershell
.\scripts\maintain-greenplus.ps1 -Apply -ArchiveFlutter -CleanGenerated
```

A locked Flutter folder is optional and will be `[FLUTTER SKIPPED]`. If a new `-Apply` reports an *unfinished* batch, restore **that exact batch ID** printed in the error before proceeding. Do not delete `artifacts/maintenance/quarantine` or use `docker compose down -v`.

The all-in-one command additionally runs lint, typecheck, static tests, **full Next.js build**, generated-file cleanup, and source ZIP packaging. If any gate fails, only the files newly quarantined in that run are restored. A pass must be confirmed on Windows before deploying.

## Verification conducted off-device

Using the reconstructed repository and this patch:

- Root tests: **227 passed / 0 failed** (including 14 maintenance tests).
- Client tests: **14 passed / 0 failed**, with `--experimental-strip-types`.
- Shipper tests: **31 passed / 0 failed**.
- CI validator: **PASS**.
- Fault injection: EBUSY optional Flutter skip and mandatory-file rollback **both exercised and passed**.
- Tested the Windows command-selection function for `cmd.exe` and rejected unsafe interpolated script names.

**Not executed:** real Windows NTFS handle locking, npm lint/typecheck, full Next.js build or Docker; this environment does not include a Windows runtime or installed Next.js dependencies.
