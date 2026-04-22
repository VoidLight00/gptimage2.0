#!/usr/bin/env bash
set -euo pipefail
# Ingest → build → Vercel prod deploy → git push 원샷
# Usage:  bash tools/publish.sh [commit-msg]

cd "$(dirname "$0")/.."
MSG="${1:-chore: re-ingest and redeploy}"

echo "▸ INGEST"
( cd web && ./node_modules/.bin/tsx scripts/ingest.ts )

echo "▸ BUILD"
( cd web && npm run build )

echo "▸ VERCEL DEPLOY"
( cd web && vercel --prod --yes )

echo "▸ GIT PUSH"
git add -A
if git diff --cached --quiet; then
  echo "  (no changes to commit)"
else
  git -c user.email=icthyeon00@gmail.com -c user.name=Son commit -m "$MSG"
  git push
fi

echo "✓ DONE  →  https://gptimage2-0.vercel.app"
