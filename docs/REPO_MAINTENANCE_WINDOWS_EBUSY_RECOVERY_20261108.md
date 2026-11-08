# GreenPlus maintenance — Windows EBUSY recovery patch

**Incident:** `mobile/customer_app` cannot be renamed because a Windows program holds it open. The original script quarantined 20 allowlisted source files first, then failed before running CI gates.

## One-time recovery before applying another cleanup

```powershell
node scripts/repo-maintenance.mjs restore --batch=batch-2026-11-08T04-29-20-256Z-17368
npm run maintain -- scan
git status --short
```

Do not delete `artifacts/maintenance/quarantine` or rerun the old `-Apply` before restoring. The batch ID here is **specific to the supplied log**.

## Install and run the fix

Unzip this changes-only patch at the GreenPlus repository root, overwriting matching files. No `npm ci` is necessary because no dependency changes are included.

```powershell
# Dry run: no source mutation
.\scripts\maintain-greenplus.ps1 -ArchiveFlutter

# Full cleanup, quality checks, generated artifacts cleanup and source ZIP
.\scripts\maintain-greenplus.ps1 -Apply -ArchiveFlutter -CleanGenerated
```

Optional Flutter prototypes that are locked will be reported as `[FLUTTER SKIPPED]` and retained. The rest of cleanup/testing continues. To avoid attempting Flutter at all, omit `-ArchiveFlutter`.

For mandatory source move errors, the batch is rolled back immediately. A recorded pending move permits recovery after a process crash. If rollback itself fails because Windows still locks a file, **do not delete quarantine**; close any process using the file and restore the exact batch printed in the error.

## Verification run against source copy

- `node --experimental-strip-types --test tests/*.test.mjs`: 225 passed.
- `node --experimental-strip-types --test web-client/tests/*.test.mjs`: 14 passed.
- `node --test web-shipper/tests/*.test.mjs`: 31 passed.
- `node scripts/ci/validate-ci.mjs`: passed.
- A sandbox copy successfully quarantined 20 approved files + both Flutter prototype folders, then restored all files.
- Failure injection verified EBUSY skips only optional Flutter, mandatory EBUSY triggers immediate rollback, pending-move recovery restores files, and an interrupted new-format batch blocks a fresh apply.

**Not tested:** actual Windows directory handle locking, `npm run lint`, `npm run typecheck`, full Next.js build or live Docker; the runtime does not have Windows/complete npm installation. No production environment, database or Docker volumes were changed.
