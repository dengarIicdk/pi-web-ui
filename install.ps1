# install.ps1 - build and install @dengarchik/pi-web-ui into the Pi agent.
# Usage (from the cloned repo folder):
#   powershell -ExecutionPolicy Bypass -File .\install.ps1
# Optional: -SkipBuild  (reuse the committed dist/ without running npm install / build)

param(
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$PkgName    = "@dengarchik/pi-web-ui"
$OldPkgName = "@kkkiio/pi-web-ui"
$RepoRoot   = $PSScriptRoot
$AgentDir   = Join-Path $env:USERPROFILE ".pi\agent"
$NpmDir     = Join-Path $AgentDir "npm"
$TargetDir  = Join-Path $NpmDir "node_modules\@dengarchik\pi-web-ui"
$Settings   = Join-Path $AgentDir "settings.json"

function Step($msg) { Write-Host ""; Write-Host "==> $msg" -ForegroundColor Cyan }
function Fail($msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }
function Run($cmd, $args2) {
  & $cmd @args2
  if ($LASTEXITCODE -ne 0) { Fail "'$cmd $($args2 -join ' ')' failed with exit code $LASTEXITCODE" }
}

# ---------- 0. Prerequisites ----------
Step "Checking prerequisites"
foreach ($tool in @("node", "npm", "npx")) {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
    Fail "'$tool' not found in PATH. Install Node.js >= 22.19 from https://nodejs.org and reopen PowerShell."
  }
}
$nodeVersion = (& node -v).TrimStart("v")
$parts = $nodeVersion.Split(".")
if ([int]$parts[0] -lt 22 -or ([int]$parts[0] -eq 22 -and [int]$parts[1] -lt 19)) {
  Fail "Node.js $nodeVersion is too old. Need >= 22.19.0."
}
Write-Host "Node $nodeVersion, npm $(& npm -v)"

Push-Location $RepoRoot
try {
  # ---------- 1. Build ----------
  if (-not $SkipBuild) {
    Step "npm install (dependencies)"
    # --ignore-scripts: avoids postinstall scripts of transitive deps that can fail on clean machines
    Run "npm" @("install", "--no-audit", "--no-fund", "--ignore-scripts")

    Step "Type check: npx tsc --noEmit"
    Run "npx" @("tsc", "--noEmit")

    Step "Build: npx vite build"
    Run "npx" @("vite", "build")
  } else {
    Step "Skipping build (-SkipBuild): using committed dist/"
  }

  if (-not (Test-Path (Join-Path $RepoRoot "dist\index.html"))) { Fail "dist\index.html missing after build." }

  # ---------- 2. Install into Pi npm directory ----------
  Step "Copying package to $TargetDir"
  if (Test-Path $TargetDir) { Remove-Item $TargetDir -Recurse -Force }
  New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null

  $items = @("dist", "extensions", "public", "package.json", "README.md", "LICENSE", "docs\configuration.md")
  foreach ($item in $items) {
    $src = Join-Path $RepoRoot $item
    if (Test-Path $src) {
      $dstParent = Split-Path (Join-Path $TargetDir $item) -Parent
      if (-not (Test-Path $dstParent)) { New-Item -ItemType Directory -Path $dstParent -Force | Out-Null }
      Copy-Item $src (Join-Path $TargetDir $item) -Recurse -Force
    }
  }

  # Runtime dependencies only (Pi provides @earendil-works/pi-coding-agent itself).
  Step "Installing runtime dependencies into the package folder"
  Push-Location $TargetDir
  try {
    Run "npm" @("install", "--omit=dev", "--no-audit", "--no-fund", "--ignore-scripts")
  } finally { Pop-Location }
}
finally { Pop-Location }

# ---------- 3. Register in Pi settings ----------
Step "Registering $PkgName in $Settings"
if (-not (Test-Path $AgentDir)) { New-Item -ItemType Directory -Path $AgentDir -Force | Out-Null }
if (Test-Path $Settings) {
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  Copy-Item $Settings "$Settings.bak-$stamp"
  Write-Host "Backup: $Settings.bak-$stamp"
  $cfg = Get-Content $Settings -Raw | ConvertFrom-Json
} else {
  $cfg = [pscustomobject]@{}
}

$newEntry = "npm:$PkgName"
$oldEntry = "npm:$OldPkgName"
$packages = @()
if ($cfg.PSObject.Properties.Name -contains "packages" -and $cfg.packages) {
  foreach ($p in @($cfg.packages)) {
    $id = if ($p -is [string]) { $p } else { [string]$p.source }
    if ($id -eq $oldEntry) { Write-Host "Disabling old entry: $oldEntry"; continue }
    if ($id -eq $newEntry) { continue }
    $packages += $p
  }
}
$packages += $newEntry
if ($cfg.PSObject.Properties.Name -contains "packages") {
  $cfg.packages = $packages
} else {
  $cfg | Add-Member -NotePropertyName "packages" -NotePropertyValue $packages
}

$json = $cfg | ConvertTo-Json -Depth 20
[IO.File]::WriteAllText($Settings, $json + "`n", (New-Object Text.UTF8Encoding($false)))
Write-Host "Settings updated. Packages: $($packages -join ', ')"

# ---------- 4. Done ----------
Step "Done"
Write-Host "Installed $PkgName. Start Pi, then run /webui inside a session to open the web UI."
Write-Host "Old package $OldPkgName is no longer listed in settings.json (its files were not deleted)."
