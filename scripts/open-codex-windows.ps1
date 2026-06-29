$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "== odedimi.com Codex workspace =="
Write-Host "Repo: $Root"

$status = git status --porcelain
if ($status) {
  Write-Host "Local changes exist. I will not pull or overwrite them."
  git status -sb
  exit 1
}

Write-Host "Fetching latest changes..."
git fetch origin

$Branch = git branch --show-current
if (-not $Branch) {
  Write-Host "No current branch detected. Stop and inspect git state."
  exit 1
}

Write-Host "Rebasing $Branch on origin/$Branch..."
git pull --rebase origin $Branch

New-Item -ItemType Directory -Force -Path ".codex-browser-profile" | Out-Null
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
New-Item -ItemType File -Force -Path "logs/.gitkeep" | Out-Null

Write-Host "Workspace is up to date."
Write-Host "Safe browser profile: $Root/.codex-browser-profile"
Write-Host "Open Codex app with this folder if it is not already open."
