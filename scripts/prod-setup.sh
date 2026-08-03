#!/usr/bin/env bash
#
# One-shot PRODUCTION database setup: migrate → seed → backfill → verify.
#
# Reads PROD_DATABASE_URL from .env.production.local (gitignored). This MUST be
# the real, non-pooled connection string (POSTGRES_URL_NON_POOLING /
# DATABASE_URL_UNPOOLED) copied from the Vercel Storage dashboard's plaintext
# view — NOT from `vercel env pull`, which returns "[SENSITIVE]".
#
# Safety: refuses localhost and refuses the "[SENSITIVE]" placeholder. Never
# touches the localhost .env. Idempotent (migrate deploy + upsert-based seed).
#
#   bash scripts/prod-setup.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."

FILE=".env.production.local"
[ -f "$FILE" ] || { echo "✖ $FILE not found."; exit 1; }

# Extract PROD_DATABASE_URL (strip surrounding quotes), without echoing it.
URL="$(grep -E '^PROD_DATABASE_URL=' "$FILE" | head -1 | cut -d= -f2- | sed -E 's/^"//; s/"$//; s/^'\''//; s/'\''$//')"

if [ -z "${URL:-}" ]; then
  echo "✖ PROD_DATABASE_URL is not set in $FILE."
  echo "  Copy POSTGRES_URL_NON_POOLING from Vercel → Storage → your DB → .env.local view,"
  echo "  then add:  PROD_DATABASE_URL=\"postgresql://…\"  to $FILE"
  exit 1
fi
case "$URL" in
  *localhost*|*127.0.0.1*) echo "✖ Refusing to target localhost."; exit 1 ;;
  '[SENSITIVE]') echo "✖ Value is the [SENSITIVE] placeholder from 'vercel env pull'. Copy the REAL string from the dashboard."; exit 1 ;;
esac
case "$URL" in
  postgres://*|postgresql://*) : ;;
  *) echo "✖ Not a postgres:// URL. Paste the real connection string."; exit 1 ;;
esac

# Direct (non-pooled) connection for every Prisma operation — avoids pgbouncer
# issues with migrations. Exported so the schema's env("DATABASE_URL") resolves.
export DATABASE_URL="$URL"
export DIRECT_URL="$URL"
export PROD_DATABASE_URL="$URL"

# Redacted confirmation of the target.
HOST="$(printf '%s' "$URL" | sed -E 's#.*@([^/:?]+).*#\1#')"
echo "Target host : $HOST  (localhost? no)"
echo "──────────────────────────────────────────"

echo "① prisma migrate deploy"
npx prisma migrate deploy

echo "② prisma db seed"
npx prisma db seed

echo "③ backfill (safety net — dry run)"
npx tsx prisma/backfill-portal-users.ts || true

echo "④ backfill --commit (creates any still-missing accounts)"
npx tsx prisma/backfill-portal-users.ts --commit

echo "✔ Production setup complete."
