/**
 * PRODUCTION-safe backfill of login accounts for parents and students.
 *
 * Parents/students exist as Parent/Student records but historically had no
 * `User` (auth) account, so they could never sign in (the portal maps a
 * logged-in user to their record BY EMAIL). This creates a role-scoped User for
 * every parent/student that has an email. Idempotent (upsert on [email,
 * schoolId]) and additive — it never deletes or overwrites an existing account.
 *
 * SAFETY:
 *   • Refuses to run against localhost/127.0.0.1 (pass --allow-local to override).
 *   • DRY RUN by default — shows what it would create; writes only with --commit.
 *   • The production URL is read from a GITIGNORED file (.env.production.local)
 *     or the PROD_DATABASE_URL env var — never from the committed .env (which is
 *     localhost) and never hard-coded.
 *
 * USAGE (from repo root):
 *   1. Put your production URL in .env.production.local (gitignored), either:
 *        PROD_DATABASE_URL="postgresql://…"      (recommended)
 *      or, if you used `vercel env pull`, the file already has DATABASE_URL=…
 *   2. Dry run:   npx tsx prisma/backfill-portal-users.ts
 *   3. Apply:     npx tsx prisma/backfill-portal-users.ts --commit
 *
 * Default passwords (CHANGE THESE / have users reset): parents "parent123",
 * students "student123".
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const COMMIT = process.argv.includes("--commit");
const ALLOW_LOCAL = process.argv.includes("--allow-local");

/** Parse a KEY=VALUE env file into a map (no dependency, no process.env mutation). */
function parseEnvFile(file: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function redact(u: string): string {
  try {
    const x = new URL(u);
    return `${x.protocol}//${x.username ? "***:***@" : ""}${x.host}${x.pathname}`;
  } catch {
    return "(unparseable url)";
  }
}

const prodFile = parseEnvFile(path.resolve(process.cwd(), ".env.production.local"));
// Resolution order: explicit prod var → gitignored prod file → process env.
const url =
  process.env.PROD_DATABASE_URL ||
  prodFile.PROD_DATABASE_URL ||
  prodFile.DATABASE_URL ||
  process.env.DATABASE_URL ||
  "";

function fail(msg: string): never {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

if (!url) {
  fail(
    "No database URL found. Create .env.production.local (gitignored) with\n" +
      '   PROD_DATABASE_URL="postgresql://…your production url…"\n' +
      "or run `vercel env pull --environment=production .env.production.local`.",
  );
}
if (/localhost|127\.0\.0\.1|::1/.test(url) && !ALLOW_LOCAL) {
  fail(
    `Refusing to run against a LOCAL database (${redact(url)}).\n` +
      "  This backfill is for PRODUCTION. Point PROD_DATABASE_URL at your cloud DB.\n" +
      "  (Pass --allow-local only if you truly intend to target localhost.)",
  );
}

const prisma = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  console.log(`Target database : ${redact(url)}`);
  console.log(`Mode            : ${COMMIT ? "COMMIT (writes accounts)" : "DRY RUN (no writes)"}`);

  // Connectivity check up-front so failures are obvious, not mid-write.
  await prisma.$queryRaw`SELECT 1`;
  console.log("Connection      : OK\n");

  const parentPass = await bcrypt.hash("parent123", 10);
  const studentPass = await bcrypt.hash("student123", 10);

  const parents = await prisma.parent.findMany({
    where: { email: { not: null }, schoolId: { not: null } },
    select: { fullName: true, email: true, schoolId: true },
  });
  const students = await prisma.student.findMany({
    where: { email: { not: null }, schoolId: { not: null } },
    select: { fullName: true, email: true, schoolId: true },
  });

  let parentsNew = 0;
  for (const p of parents) {
    if (!p.email || !p.schoolId) continue;
    const exists = await prisma.user.findUnique({
      where: { email_schoolId: { email: p.email, schoolId: p.schoolId } },
    });
    if (exists) continue;
    parentsNew++;
    if (COMMIT) {
      await prisma.user.create({
        data: { name: p.fullName, email: p.email, password: parentPass, role: "PARENT", schoolId: p.schoolId },
      });
    }
  }

  let studentsNew = 0;
  for (const s of students) {
    if (!s.email || !s.schoolId) continue;
    const exists = await prisma.user.findUnique({
      where: { email_schoolId: { email: s.email, schoolId: s.schoolId } },
    });
    if (exists) continue;
    studentsNew++;
    if (COMMIT) {
      await prisma.user.create({
        data: { name: s.fullName, email: s.email, password: studentPass, role: "STUDENT", schoolId: s.schoolId },
      });
    }
  }

  const byRole = await prisma.user.groupBy({ by: ["role"], _count: true });
  const orgs = await prisma.organization.findMany({ select: { name: true, slug: true, status: true } });

  console.log(`Parents  : ${parents.length} with email — ${COMMIT ? "created" : "would create"} ${parentsNew} account(s)`);
  console.log(`Students : ${students.length} with email — ${COMMIT ? "created" : "would create"} ${studentsNew} account(s)`);
  console.log("\nUser accounts by role:", byRole.map((r) => `${r.role}=${r._count}`).join(", ") || "(none)");
  console.log("Organizations (login 'School' slug):", orgs.map((o) => `${o.slug}${o.status !== "ACTIVE" ? `[${o.status}]` : ""}`).join(", ") || "(none)");

  // Sample login usernames to test with (no passwords printed).
  const sampleParent = await prisma.user.findFirst({ where: { role: "PARENT" }, select: { email: true } });
  const sampleStudent = await prisma.user.findFirst({ where: { role: "STUDENT" }, select: { email: true } });
  const sampleAdmin = await prisma.user.findFirst({ where: { role: { in: ["ADMIN", "SCHOOL_ADMIN"] } }, select: { email: true } });
  console.log("\nSample logins to test (defaults — change after):");
  if (sampleAdmin) console.log(`  admin   : ${sampleAdmin.email}`);
  if (sampleParent) console.log(`  parent  : ${sampleParent.email}  / parent123`);
  if (sampleStudent) console.log(`  student : ${sampleStudent.email}  / student123`);

  if (!COMMIT && (parentsNew || studentsNew)) {
    console.log("\n➜ Re-run with --commit to create the accounts above.");
  } else if (COMMIT) {
    console.log("\n✔ Backfill complete.");
  } else {
    console.log("\n✔ Nothing to create — every parent/student already has an account.");
  }
}

main()
  .catch((e) => fail(`Backfill failed: ${e?.message ?? e}`))
  .finally(() => prisma.$disconnect());
