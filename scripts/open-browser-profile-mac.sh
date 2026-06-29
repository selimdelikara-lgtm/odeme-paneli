#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROFILE="$ROOT/.codex-browser-profile"
mkdir -p "$PROFILE" "$ROOT/logs"

echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") open browser profile" >> "$ROOT/logs/browser-agent.log"

if command -v chromium >/dev/null 2>&1; then
  chromium --user-data-dir="$PROFILE" "https://odedimi.com" >/dev/null 2>&1 &
elif command -v google-chrome >/dev/null 2>&1; then
  google-chrome --user-data-dir="$PROFILE" "https://odedimi.com" >/dev/null 2>&1 &
elif [ -d "/Applications/Google Chrome.app" ]; then
  open -na "Google Chrome" --args --user-data-dir="$PROFILE" "https://odedimi.com"
else
  echo "Chrome/Chromium was not found. Use Codex in-app browser or install Chrome."
  exit 1
fi
