/**
 * Backfill login accounts for parents and students.
 *
 * Parents and students exist as `Parent`/`Student` records but historically had
 * NO `User` (auth) accounts, so they could never sign in — the parent/student
 * portals map the logged-in user to their record BY EMAIL, and with no matching
 * User the portal is blank.
 *
 * This script creates a role-scoped User for every parent/student that has an
 * email. It is idempotent (upsert on the unique [email, schoolId]) so it is safe
 * to run repeatedly. Default passwords: parents "parent123", students "student123".
 *
 *   npx tsx prisma/backfill-portal-users.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const parentPass = await bcrypt.hash("parent123", 10);
  const studentPass = await bcrypt.hash("student123", 10);

  const parents = await prisma.parent.findMany({
    where: { email: { not: null }, schoolId: { not: null } },
    select: { fullName: true, email: true, schoolId: true },
  });
  let parentsCreated = 0;
  for (const p of parents) {
    if (!p.email || !p.schoolId) continue;
    await prisma.user.upsert({
      where: { email_schoolId: { email: p.email, schoolId: p.schoolId } },
      update: {}, // never clobber an existing account / password
      create: { name: p.fullName, email: p.email, password: parentPass, role: "PARENT", schoolId: p.schoolId },
    });
    parentsCreated++;
  }

  const students = await prisma.student.findMany({
    where: { email: { not: null }, schoolId: { not: null } },
    select: { fullName: true, email: true, schoolId: true },
  });
  let studentsCreated = 0;
  for (const s of students) {
    if (!s.email || !s.schoolId) continue;
    await prisma.user.upsert({
      where: { email_schoolId: { email: s.email, schoolId: s.schoolId } },
      update: {},
      create: { name: s.fullName, email: s.email, password: studentPass, role: "STUDENT", schoolId: s.schoolId },
    });
    studentsCreated++;
  }

  const byRole = await prisma.user.groupBy({ by: ["role"], _count: true });
  console.log(`✔ Parents processed: ${parentsCreated}, students processed: ${studentsCreated}`);
  console.log("User accounts by role:", byRole.map((r) => `${r.role}=${r._count}`).join(", "));
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
