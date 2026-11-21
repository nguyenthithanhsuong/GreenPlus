# GreenPlus Windows storage helper. Safe by default: preview unless -Apply.
# Docker's WSL2 disk must be moved separately in Docker Desktop settings.
[CmdletBinding()]
param(
    [string]$TargetRoot = 'F:\GreenPlusData',
    [switch]$Apply,
    [switch]$CleanOldNpmCache
)
$ErrorActionPreference = 'Stop'
$target = [IO.Path]::GetFullPath($TargetRoot)
$volume = [IO.Path]::GetPathRoot($target)
if (-not $volume -or $volume -eq 'C:\') { throw 'TargetRoot must point to a non-C: local drive.' }
if (-not (Test-Path -LiteralPath $volume)) { throw "Destination drive is not available: $volume" }
$cache = Join-Path $target 'npm-cache'
$temp = Join-Path $target 'temp'
$oldCache = Join-Path $env:LOCALAPPDATA 'npm-cache'
$dockerWsl = Join-Path $env:LOCALAPPDATA 'Docker\wsl'
Write-Host "Target npm cache: $cache"
Write-Host "Target TEMP/TMP : $temp"
Write-Host "Current npm cache: $oldCache"
Write-Host "Docker WSL data (DO NOT DELETE): $dockerWsl"
Get-PSDrive -Name 'C',($volume.TrimEnd('\').TrimEnd(':')) | Select-Object Name, Used, Free | Format-Table
if (-not $Apply) {
    Write-Host 'Preview only. Run with -Apply to configure the new user paths.' -ForegroundColor Yellow
    Write-Host 'Optionally add -CleanOldNpmCache AFTER closing npm/Node terminals.'
    return
}
foreach ($folder in @($target,$cache,$temp)) {
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
}
# Update the current shell AND future shells (user scope only; no admin required).
foreach ($name in @('TEMP','TMP')) {
    [Environment]::SetEnvironmentVariable($name,$temp,'User')
    Set-Item -Path "Env:$name" -Value $temp
}
[Environment]::SetEnvironmentVariable('NPM_CONFIG_CACHE',$cache,'User')
$env:NPM_CONFIG_CACHE = $cache
# npm user config makes the cache path persist even when npm_config_cache is absent.
& npm config set cache $cache --location=user
if ($LASTEXITCODE -ne 0) { throw 'npm config set cache failed.' }
Write-Host "npm cache configured: $(& npm config get cache)" -ForegroundColor Green
if ($CleanOldNpmCache) {
    $runningNode = @(Get-Process -Name 'node','npm' -ErrorAction SilentlyContinue)
    if ($runningNode.Count) {
        Write-Warning 'Node/npm processes are still running; old npm cache was NOT deleted. Close them and retry.'
    } elseif ((Test-Path -LiteralPath $oldCache) -and ($oldCache -ne $cache)) {
        Remove-Item -LiteralPath $oldCache -Recurse -Force
        Write-Host "Deleted old, regenerable npm cache: $oldCache" -ForegroundColor Green
    } else {
        Write-Host 'Old cache already absent (or equal to destination); nothing deleted.'
    }
}
Write-Host 'Done. Open a NEW PowerShell window to inherit user-level TEMP/TMP and npm settings.' -ForegroundColor Green
Write-Host 'Docker disk: use Docker Desktop > Settings > Resources > Advanced > Disk image location.'
