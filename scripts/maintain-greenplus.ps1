# GreenPlus repository maintenance for Windows PowerShell 5+ / PowerShell 7+.
# Default is a source-safe preview. Files are quarantined only with -Apply.
[CmdletBinding()]
param(
    [switch]$Apply,
    [switch]$ArchiveFlutter,
    [switch]$CleanGenerated,
    [switch]$DockerChecks,
    [switch]$SkipBuild,
    [switch]$InstallDependencies
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot

function Invoke-CheckedNpm {
    param([string[]]$NpmArguments)
    & npm @NpmArguments
    if ($LASTEXITCODE -ne 0) {
        throw "npm $($NpmArguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

Push-Location $Root
try {
    if (-not $Apply) {
        Write-Host 'GreenPlus maintenance preview; no source files will be modified.'
        Invoke-CheckedNpm -NpmArguments @('run', 'maintain:scan')
        $previewArgs = @('run', 'maintain:clean', '--')
        if ($ArchiveFlutter) { $previewArgs += '--legacy-flutter' }
        Invoke-CheckedNpm -NpmArguments $previewArgs
        Write-Host 'To quarantine approved legacy files and run quality gates, rerun with -Apply.'
        return
    }

    if (-not (Test-Path (Join-Path $Root 'node_modules'))) {
        if (-not $InstallDependencies) {
            throw 'Root node_modules missing. Run npm ci first or use -InstallDependencies.'
        }
        Invoke-CheckedNpm -NpmArguments @('ci')
    }

    $maintenanceArgs = @('run', 'maintain:all', '--', '--apply', '--zip')
    if ($ArchiveFlutter) { $maintenanceArgs += '--legacy-flutter' }
    if ($CleanGenerated) { $maintenanceArgs += '--generated' }
    if ($DockerChecks) { $maintenanceArgs += '--docker' }
    if ($SkipBuild) { $maintenanceArgs += '--no-build' }

    Invoke-CheckedNpm -NpmArguments $maintenanceArgs
    Write-Host 'Source cleanup and quality checks completed.'
    if (Get-Command git -ErrorAction SilentlyContinue) {
        & git status --short
    }
    Write-Host 'Review the diff. Restore with npm run maintain:restore if needed.'
}
finally {
    Pop-Location
}
