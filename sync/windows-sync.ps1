$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

git pull --rebase origin main
git status --short

if ((git status --porcelain).Trim()) {
  git add -A
  git commit -m "Sync local changes"
  git push origin main
} else {
  Write-Host "No local changes."
}
