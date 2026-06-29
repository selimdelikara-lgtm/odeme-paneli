$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "== save odedimi.com work =="
git status -sb

$Message = $args[0]
if (-not $Message) {
  $Message = Read-Host "Commit message"
}

if (-not $Message.Trim()) {
  Write-Host "Empty commit message. Nothing was committed."
  exit 1
}

$Pathspecs = @(
  ":!*.env",
  ":!.env*",
  ":!.vercel/**",
  ":!.codex-browser-profile/**",
  ":!logs/**"
)
git add -A -- @Pathspecs

$StagedFiles = git diff --cached --name-only
if (-not $StagedFiles) {
  Write-Host "No staged changes to commit."
  exit 0
}

$Sensitive = $StagedFiles | Select-String -Pattern '(^|/)(\.env|\.vercel|\.codex-browser-profile|logs)(/|$)|\.pem$|\.key$'
if ($Sensitive) {
  Write-Host "Sensitive or local-only files are staged. Abort."
  exit 1
}

Write-Host "Staged files:"
$StagedFiles

git commit -m $Message
$Branch = git branch --show-current
git push origin $Branch
