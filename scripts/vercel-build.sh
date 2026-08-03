#!/usr/bin/env bash
#
# Vercel build entrypoint.
#
# Runs Prisma migrations (and an optional one-time seed) INSIDE the Vercel build,
# where DATABASE_URL / POSTGRES_URL_NON_POOLING are injected at runtime. The
# connection string is never pulled locally or exposed — it only exists in
# Vercel's environment.
#
# Locally (`npm run build`, VERCEL unset) the DB steps are skipped entirely, so
# a local build never touches the cloud database.
#
set -euo pipefail

# Prisma client is always required for the build.
npx prisma generate

if [ "${VERCEL:-}" = "1" ]; then
  # Migrations require a DIRECT (non-pooled) connection — pgbouncer/pooled URLs
  # break advisory locks. Prefer the non-pooled var, fall back to DATABASE_URL.
  MIGRATE_URL="${POSTGRES_URL_NON_POOLING:-${DATABASE_URL_UNPOOLED:-${DATABASE_URL:-}}}"

  if [ -z "$MIGRATE_URL" ]; then
    echo "✖ No database URL injected (POSTGRES_URL_NON_POOLING / DATABASE_URL). Aborting build." >&2
    exit 1
  fi

  echo "→ prisma migrate deploy (direct connection)"
  DATABASE_URL="$MIGRATE_URL" npx prisma migrate deploy

  # One-time data seed: set RUN_DB_SEED=true in Vercel env for a single deploy,
  # then remove it. The seed is idempotent (upserts), so a stray re-run is safe.
  if [ "${RUN_DB_SEED:-}" = "true" ]; then
    echo "→ RUN_DB_SEED=true → seeding database (admin + parent/student accounts)"
    DATABASE_URL="$MIGRATE_URL" npx tsx prisma/seed.ts
  else
    echo "→ RUN_DB_SEED not set → skipping seed"
  fi
fi

npx next build
