#!/usr/bin/env bash
set -euo pipefail
# Ingest KO (xlsx) + EN (awesome-gpt-image) → build → Vercel prod deploy → git push
# Usage:  bash tools/publish.sh [commit-msg]

cd "$(dirname "$0")/.."
MSG="${1:-chore: re-ingest and redeploy}"

echo "▸ INGEST — KO"
( cd web && ./node_modules/.bin/tsx scripts/ingest.ts )

if [ -d external/awesome-gpt-image ]; then
  echo "▸ INGEST — EN"
  ( cd web && ./node_modules/.bin/tsx scripts/ingest-en.ts )
fi

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
