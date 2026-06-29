$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Profile = Join-Path $Root ".codex-browser-profile"
$LogDir = Join-Path $Root "logs"
New-Item -ItemType Directory -Force -Path $Profile | Out-Null
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

"$(Get-Date -Format o) open browser profile" | Out-File -Append -Encoding utf8 (Join-Path $LogDir "browser-agent.log")

$ChromePaths = @(
  "$Env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "$Env:ProgramFiles(x86)\Google\Chrome\Application\chrome.exe",
  "$Env:LocalAppData\Google\Chrome\Application\chrome.exe"
)

$Chrome = $ChromePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $Chrome) {
  Write-Host "Chrome was not found. Use Codex in-app browser or install Chrome."
  exit 1
}

Start-Process $Chrome -ArgumentList "--user-data-dir=`"$Profile`"", "https://odedimi.com"
