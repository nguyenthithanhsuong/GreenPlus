# GreenPlus final one-command quality/security verification on Windows.
# No Docker prune, no Supabase push/reset, no secret dump; no repeated builds.
[CmdletBinding()]
param([switch]$SkipDependencyUpgrade)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location -LiteralPath $root
$reportDir = Join-Path $root 'artifacts\ci'
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
$rows = New-Object System.Collections.Generic.List[object]

function Invoke-Checked {
    param([string]$Label,[string]$Command,[string[]]$Arguments,[switch]$Optional)
    Write-Host "`n========== $Label ==========" -ForegroundColor Cyan
    # Stream stdout to the host so $ok receives only the explicit Boolean result.
    & $Command @Arguments | Out-Host
    $exit = $LASTEXITCODE
    if ($null -eq $exit) { $exit = 1 }
    $state = if ($exit -eq 0) { 'PASS' } elseif ($Optional) { 'WARNING' } else { 'FAIL' }
    $script:rows.Add([pscustomobject]@{ Check=$Label; Result=$state; Exit=$exit })
    Write-Host "$Label : $state (exit $exit)" -ForegroundColor $(if($state -eq 'PASS'){'Green'}elseif($state -eq 'WARNING'){'Yellow'}else{'Red'})
    return ($exit -eq 0)
}

try {
    Write-Host 'GreenPlus · one-time final verification (source/lock/dependencies must match)' -ForegroundColor Cyan
    Write-Host "Working directory: $root"
    $ok = Invoke-Checked 'CI and Docker configuration' 'node' @('scripts/ci/validate-ci.mjs')
    if (-not $ok) { throw 'Static CI contract failed; no dependency changes attempted.' }
    $ok = Invoke-Checked 'Immutable Supabase migrations (offline)' 'node' @('scripts/ci/supabase-migration-gate.mjs','--static')
    if (-not $ok) { throw 'Migration baseline failed. Do not reset or rewrite SQL history.' }

    if (-not $SkipDependencyUpgrade) {
        $ok = Invoke-Checked 'Transactional Next.js security upgrade' 'npm.cmd' @('run','security:next:apply')
        if (-not $ok) { throw 'Next.js lock regeneration failed; the upgrade script restored the original manifests.' }
        # npm audit fix WITHOUT --force updates compatible transitive packages only.
        # A nonzero audit-fix exit can mean remaining nonfixable advisories. The independent
        # audit gate below decides whether high/critical findings remain.
        $null = Invoke-Checked 'Compatible transitive security fixes (no force)' 'npm.cmd' @('audit','fix','--package-lock-only','--ignore-scripts','--no-fund','--omit=dev','--audit-level=high') -Optional
    }

    $ok = Invoke-Checked 'Install exactly the updated lockfile' 'npm.cmd' @('ci','--no-fund')
    if (-not $ok) { throw 'npm ci failed: do not trust any lint/build result without dependencies.' }
    $versions = Invoke-Checked 'Offline Next.js security lockfile gate' 'node' @('scripts/ci/dependency-version-gate.mjs')
    $quality = Invoke-Checked 'All 6 ESLint / TypeScript checks' 'npm.cmd' @('run','ci:quality-report')
    $tests = Invoke-Checked 'All root/Client/Shipper unit and security tests' 'npm.cmd' @('test')
    $audit = Invoke-Checked 'Production dependency high/critical audit' 'node' @('scripts/ci/dependency-audit.mjs')
    if ($versions -and $quality -and $tests -and $audit) {
        $null = Invoke-Checked 'Production build: Admin, Client and Shipper (once)' 'npm.cmd' @('run','build')
    } else {
        $script:rows.Add([pscustomobject]@{ Check='Production build'; Result='SKIPPED'; Exit='Prerequisites failed' })
    }
} catch {
    Write-Host "Final verification interrupted: $($_.Exception.Message)" -ForegroundColor Red
    $rows.Add([pscustomobject]@{ Check='Finalization'; Result='FAIL'; Exit='Stopped safely' })
} finally {
    $path = Join-Path $reportDir 'final-verification.md'
    $lines = @('# GreenPlus · Final verification','',"Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')",'', '| Check | Result |','|---|---|')
    foreach ($row in $rows) {
        $lines += "| $($row.Check) | $($row.Result) |"
    }
    $lines += ''
    $failed = @($rows | Where-Object { $_.Result -eq 'FAIL' })
    $skipped = @($rows | Where-Object { $_.Result -eq 'SKIPPED' })
    $overall = 'NOT ACCEPTED'
    if (($failed.Count -eq 0) -and ($skipped.Count -eq 0)) {
        $overall = 'PASS (see WARNING rows)'
    }
    $lines += "**Overall:** $overall"
    $lines += ''
    $lines += 'Warnings remain visible; a successful gate is not proof of live Docker/Supabase/LLM end-to-end behavior.'
    $lines | Set-Content -Path $path -Encoding UTF8
    Write-Host "`nReport: $path" -ForegroundColor Cyan
    if (($failed.Count -gt 0) -or ($skipped.Count -gt 0)) { exit 1 }
    exit 0
}
