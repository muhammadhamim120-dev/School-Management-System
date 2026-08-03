/**
 * Normalize the database connection env var.
 *
 * The Vercel Postgres / Neon integration adds its variables under a project
 * prefix (e.g. `school_management_DATABASE_URL`, `school_management_POSTGRES_PRISMA_URL`),
 * but Prisma's schema reads the standard `env("DATABASE_URL")`. When the standard
 * name is absent we adopt the best available prefixed URL so the app can connect
 * in every environment without hard-coding the prefix or exposing any secret.
 *
 * Preference (runtime = serverless → pooled):
 *   DATABASE_URL → *POSTGRES_PRISMA_URL (pooled, pgbouncer) → *DATABASE_URL → *POSTGRES_URL
 *
 * Idempotent and side-effect-only; import it before instantiating PrismaClient.
 */
export function normalizeDatabaseUrl(): void {
  if (process.env.DATABASE_URL) return;

  const env = process.env;
  const keys = Object.keys(env);
  const bySuffix = (suffix: string) =>
    keys.find((k) => k.endsWith(suffix) && !!env[k]);

  const key =
    bySuffix("POSTGRES_PRISMA_URL") || // pooled, tuned for Prisma/serverless
    bySuffix("DATABASE_URL") ||        // e.g. <prefix>_DATABASE_URL
    bySuffix("POSTGRES_URL");          // last resort

  if (key && env[key]) {
    env.DATABASE_URL = env[key];
  }
}

normalizeDatabaseUrl();
