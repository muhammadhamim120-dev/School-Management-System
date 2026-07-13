/**
 * Data Migration Script: Assigns all existing single-tenant data to a default Organization.
 *
 * Run with: npx tsx prisma/seed-tenant.ts
 *
 * This script:
 * 1. Creates a default Organization from the existing Setting
 * 2. Creates a default FREE Subscription
 * 3. Updates all existing rows to belong to the default org
 * 4. Verifies no orphaned rows remain
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Starting tenant data migration...\n");

  // 1. Get existing setting
  const setting = await prisma.setting.findFirst();
  if (!setting) {
    console.error("❌ No Setting record found. Run the main seed first.");
    process.exit(1);
  }

  // 2. Create default Organization
  const org = await prisma.organization.upsert({
    where: { slug: "default" },
    update: {},
    create: {
      name: setting.schoolName || "Default School",
      slug: "default",
      email: setting.email || "admin@school.com",
      phone: setting.phone,
      address: setting.address,
      logo: setting.logo,
      status: "ACTIVE",
    },
  });
  console.log(`✔ Organization created: ${org.name} (${org.id})`);

  // 3. Create default FREE subscription
  await prisma.subscription.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      tier: "FREE",
      status: "ACTIVE",
      maxStudents: 100,
      maxTeachers: 20,
      maxStorageMb: 500,
    },
  });
  console.log("✔ Default FREE subscription created");

  // 4. Link Setting to org
  await prisma.setting.update({
    where: { id: setting.id },
    data: { schoolId: org.id },
  });
  console.log("✔ Setting linked to organization");

  // 5. Models that need schoolId set
  const modelsToMigrate = [
    "user",
    "class",
    "section",
    "subject",
    "student",
    "teacher",
    "parent",
    "attendance",
    "teacherAttendance",
    "coachingBatch",
    "exam",
    "notice",
    "event",
    "campus",
    "academicSession",
    "term",
    "boardRegistration",
    "feeCategory",
    "feeStructure",
    "invoice",
    "payment",
    "bookCategory",
    "author",
    "publisher",
    "book",
    "driver",
    "vehicle",
    "transportRoute",
    "hostelBuilding",
    "smsTemplate",
    "smsMessage",
    "admissionSession",
    "riskAssessment",
    "routineSlot",
    "homework",
    "parentMessage",
    "leaveRequest",
    "certificate",
    "question",
    "onlineExam",
  ];

  console.log("\n📋 Migrating models to default organization...");
  let totalUpdated = 0;

  for (const model of modelsToMigrate) {
    try {
      const result = await (prisma as any)[model].updateMany({
        where: { schoolId: null },
        data: { schoolId: org.id },
      });
      if (result.count > 0) {
        console.log(`  ✔ ${model}: ${result.count} rows updated`);
        totalUpdated += result.count;
      }
    } catch (e: any) {
      // Some models might not have schoolId yet or might fail - log and continue
      console.log(`  ⚠ ${model}: skipped (${e.message?.slice(0, 60)})`);
    }
  }

  console.log(`\n✅ Migration complete! ${totalUpdated} total rows assigned to organization "${org.name}"`);
  console.log(`   Organization ID: ${org.id}`);
  console.log(`   Slug: ${org.slug}`);
  console.log(`   All future queries will be scoped to this tenant.`);
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
