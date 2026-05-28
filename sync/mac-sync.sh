#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
git pull --rebase origin main
git status --short

if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -m "Sync local changes"
  git push origin main
else
  echo "No local changes."
fi
