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

# Resolve the best usable connection string from the file: prefer an explicit
# PROD_DATABASE_URL, then any non-pooled URL, then a pooled one. Only accepts a
# real postgres:// value (skips "[SENSITIVE]" placeholders and localhost). This
# lets you paste the Vercel dashboard snippet as-is without renaming keys.
URL="$(python3 - "$FILE" <<'PY' || true
import sys, re
vals = {}
for raw in open(sys.argv[1]):
    s = raw.strip()
    if "=" not in s or s.startswith("#"): continue
    k, v = s.split("=", 1)
    vals[k.strip()] = v.strip().strip('"').strip("'")
def real(v):
    return (v.startswith("postgres://") or v.startswith("postgresql://")) \
        and "localhost" not in v and "127.0.0.1" not in v
order = ["PROD_DATABASE_URL", "POSTGRES_URL_NON_POOLING", "DATABASE_URL_UNPOOLED",
         "school_management_POSTGRES_URL_NON_POOLING", "school_management_DATABASE_URL_UNPOOLED",
         "DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL",
         "school_management_DATABASE_URL", "school_management_POSTGRES_URL"]
for k in order:
    v = vals.get(k)
    if v and real(v):
        print(v); break
PY
)"

if [ -z "${URL:-}" ]; then
  echo "✖ No usable production connection string found in $FILE."
  echo "  Every DB value is either absent or the '[SENSITIVE]' placeholder that"
  echo "  'vercel env pull' writes. Get the REAL string from the dashboard:"
  echo "    Vercel → Storage → your Postgres DB → '.env.local' / 'Quickstart' view"
  echo "    (or Neon Console → Connection details), then add to $FILE:"
  echo "      PROD_DATABASE_URL=\"postgresql://…non-pooled url…\""
  exit 1
fi

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
