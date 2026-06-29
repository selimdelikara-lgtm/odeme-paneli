#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== save odedimi.com work =="
git status -sb

MESSAGE="${1:-}"
if [ -z "$MESSAGE" ]; then
  printf "Commit message: "
  read -r MESSAGE
fi

if [ -z "${MESSAGE// }" ]; then
  echo "Empty commit message. Nothing was committed."
  exit 1
fi

git add -A -- \
  ':!*.env' \
  ':!.env*' \
  ':!.vercel/**' \
  ':!.codex-browser-profile/**' \
  ':!logs/**'

STAGED_FILES="$(git diff --cached --name-only)"
if [ -z "$STAGED_FILES" ]; then
  echo "No staged changes to commit."
  exit 0
fi

if printf "%s\n" "$STAGED_FILES" | grep -E '(^|/)(\\.env|\\.vercel|\\.codex-browser-profile|logs)(/|$)|\\.pem$|\\.key$'; then
  echo "Sensitive or local-only files are staged. Abort."
  exit 1
fi

echo "Staged files:"
printf "%s\n" "$STAGED_FILES"

git commit -m "$MESSAGE"
git push origin "$(git branch --show-current)"
