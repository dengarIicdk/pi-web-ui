# setup.ps1 - one-line bootstrap for pi-web-ui.
# Usage:
#   irm https://raw.githubusercontent.com/dengarIicdk/pi-web-ui/main/setup.ps1 | iex
#
# Downloads the main branch ZIP, extracts it into a temp folder,
# runs install.ps1 -SkipBuild and removes all temporary files afterwards.

$ErrorActionPreference = "Stop"

# Enable TLS 1.2 (default on older Windows PowerShell 5.1 builds)
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

$Owner   = "dengarIicdk"
$Repo    = "pi-web-ui"
$Branch  = "main"
$ZipUrl  = "https://github.com/$Owner/$Repo/archive/refs/heads/$Branch.zip"

$WorkDir = Join-Path ([System.IO.Path]::GetTempPath()) ("pi-web-ui-setup-" + [guid]::NewGuid().ToString("N"))
$ZipPath = Join-Path $WorkDir "$Repo-$Branch.zip"
$ExtractDir = Join-Path $WorkDir "extracted"

try {
    New-Item -ItemType Directory -Path $WorkDir -Force | Out-Null
    New-Item -ItemType Directory -Path $ExtractDir -Force | Out-Null

    Write-Host "Downloading $ZipUrl ..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipPath -UseBasicParsing

    Write-Host "Extracting archive ..." -ForegroundColor Cyan
    Expand-Archive -Path $ZipPath -DestinationPath $ExtractDir -Force

    $InstallScript = Get-ChildItem -Path $ExtractDir -Filter "install.ps1" -Recurse -File | Select-Object -First 1
    if (-not $InstallScript) {
        throw "install.ps1 not found in the downloaded archive."
    }

    Write-Host "Running install.ps1 -SkipBuild ..." -ForegroundColor Cyan
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $InstallScript.FullName -SkipBuild
    if ($LASTEXITCODE -ne 0) {
        throw "install.ps1 failed with exit code $LASTEXITCODE."
    }

    Write-Host "pi-web-ui setup finished." -ForegroundColor Green
}
finally {
    # Clean up temporary archive and extracted files
    if (Test-Path -LiteralPath $WorkDir) {
        Remove-Item -LiteralPath $WorkDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
