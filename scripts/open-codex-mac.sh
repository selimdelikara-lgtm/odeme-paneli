#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== odedimi.com Codex workspace =="
echo "Repo: $ROOT"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Local changes exist. I will not pull or overwrite them."
  git status -sb
  exit 1
fi

echo "Fetching latest changes..."
git fetch origin

BRANCH="$(git branch --show-current)"
if [ -z "$BRANCH" ]; then
  echo "No current branch detected. Stop and inspect git state."
  exit 1
fi

echo "Rebasing $BRANCH on origin/$BRANCH..."
git pull --rebase origin "$BRANCH"

mkdir -p .codex-browser-profile logs
touch logs/.gitkeep

echo "Workspace is up to date."
echo "Safe browser profile: $ROOT/.codex-browser-profile"
echo "Open Codex app with this folder if it is not already open."
