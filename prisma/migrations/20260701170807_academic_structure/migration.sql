-- Academic Structure migration (Bangladesh core)
-- Additive only: new enums, new tables, and new NULLABLE columns with optional FKs.
-- Safe to run on an existing populated database (no data loss) and on a fresh one.

-- ---------- New enums ----------
CREATE TYPE "Medium" AS ENUM ('BANGLA', 'ENGLISH', 'MADRASA');
CREATE TYPE "MadrasaLevel" AS ENUM ('EBTEDAYEE', 'DAKHIL', 'ALIM');
CREATE TYPE "Shift" AS ENUM ('MORNING', 'DAY', 'EVENING');
CREATE TYPE "BoardExam" AS ENUM ('PEC', 'JSC', 'SSC', 'HSC');
CREATE TYPE "BoardRegStatus" AS ENUM ('PENDING', 'REGISTERED', 'APPROVED', 'REJECTED');

-- ---------- Campus ----------
CREATE TABLE "Campus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Campus_name_key" ON "Campus"("name");
CREATE UNIQUE INDEX "Campus_code_key" ON "Campus"("code");

-- ---------- AcademicSession ----------
CREATE TABLE "AcademicSession" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AcademicSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AcademicSession_name_key" ON "AcademicSession"("name");

-- ---------- Term ----------
CREATE TABLE "Term" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Term_sessionId_name_key" ON "Term"("sessionId", "name");
ALTER TABLE "Term" ADD CONSTRAINT "Term_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- BoardRegistration ----------
CREATE TABLE "BoardRegistration" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "boardExam" "BoardExam" NOT NULL,
    "regNumber" TEXT,
    "rollNumber" TEXT,
    "examYear" INTEGER NOT NULL,
    "boardName" TEXT,
    "status" "BoardRegStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BoardRegistration_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BoardRegistration_studentId_boardExam_examYear_key"
    ON "BoardRegistration"("studentId", "boardExam", "examYear");
ALTER TABLE "BoardRegistration" ADD CONSTRAINT "BoardRegistration_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- New nullable columns on Class ----------
ALTER TABLE "Class" ADD COLUMN "medium" "Medium";
ALTER TABLE "Class" ADD COLUMN "shift" "Shift";
ALTER TABLE "Class" ADD COLUMN "campusId" TEXT;
ALTER TABLE "Class" ADD COLUMN "sessionId" TEXT;
ALTER TABLE "Class" ADD CONSTRAINT "Class_campusId_fkey"
    FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Class" ADD CONSTRAINT "Class_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------- New nullable columns on Student ----------
ALTER TABLE "Student" ADD COLUMN "medium" "Medium";
ALTER TABLE "Student" ADD COLUMN "madrasaLevel" "MadrasaLevel";
ALTER TABLE "Student" ADD COLUMN "shift" "Shift";
ALTER TABLE "Student" ADD COLUMN "campusId" TEXT;
ALTER TABLE "Student" ADD COLUMN "sessionId" TEXT;
ALTER TABLE "Student" ADD CONSTRAINT "Student_campusId_fkey"
    FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------- New nullable column on Teacher ----------
ALTER TABLE "Teacher" ADD COLUMN "campusId" TEXT;
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_campusId_fkey"
    FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
