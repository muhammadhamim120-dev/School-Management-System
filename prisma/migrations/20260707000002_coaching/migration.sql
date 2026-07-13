-- Coaching module: batches, enrollments, and batch attendance.
-- Batch fees/payments reuse the existing finance system (FeeCategory type
-- COACHING + Invoices + Payments), so no new payment tables here.

CREATE TABLE "CoachingBatch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subjectId" TEXT,
    "teacherId" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "monthlyFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "room" TEXT,
    "schedule" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CoachingBatch_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CoachingBatch_subjectId_idx" ON "CoachingBatch"("subjectId");
CREATE INDEX "CoachingBatch_teacherId_idx" ON "CoachingBatch"("teacherId");
CREATE INDEX "CoachingBatch_status_idx" ON "CoachingBatch"("status");
ALTER TABLE "CoachingBatch"
  ADD CONSTRAINT "CoachingBatch_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CoachingBatch"
  ADD CONSTRAINT "CoachingBatch_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "BatchEnrollment" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BatchEnrollment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BatchEnrollment_batchId_studentId_key" ON "BatchEnrollment"("batchId", "studentId");
CREATE INDEX "BatchEnrollment_studentId_idx" ON "BatchEnrollment"("studentId");
ALTER TABLE "BatchEnrollment"
  ADD CONSTRAINT "BatchEnrollment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "CoachingBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BatchEnrollment"
  ADD CONSTRAINT "BatchEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BatchAttendance" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BatchAttendance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BatchAttendance_batchId_studentId_date_key" ON "BatchAttendance"("batchId", "studentId", "date");
CREATE INDEX "BatchAttendance_batchId_date_idx" ON "BatchAttendance"("batchId", "date");
ALTER TABLE "BatchAttendance"
  ADD CONSTRAINT "BatchAttendance_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "CoachingBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BatchAttendance"
  ADD CONSTRAINT "BatchAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
