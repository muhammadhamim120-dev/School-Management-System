-- Attendance upgrade: device capture (QR/RFID/FINGERPRINT), teacher attendance,
-- late-detection settings, and instant-parent-SMS toggle.

-- New enum for capture method.
CREATE TYPE "AttendanceMethod" AS ENUM ('MANUAL', 'QR', 'RFID', 'FINGERPRINT');

-- Extend student attendance with check-in time, method, and recorder.
ALTER TABLE "Attendance" ADD COLUMN "checkInTime" TIMESTAMP(3);
ALTER TABLE "Attendance" ADD COLUMN "method" "AttendanceMethod" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "Attendance" ADD COLUMN "recordedBy" TEXT;
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");
CREATE INDEX "Attendance_method_idx" ON "Attendance"("method");

-- Teacher attendance (parallel model, keyed by teacher + date).
CREATE TABLE "TeacherAttendance" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "remark" TEXT,
    "checkInTime" TIMESTAMP(3),
    "method" "AttendanceMethod" NOT NULL DEFAULT 'MANUAL',
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeacherAttendance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TeacherAttendance_teacherId_date_key" ON "TeacherAttendance"("teacherId", "date");
CREATE INDEX "TeacherAttendance_date_idx" ON "TeacherAttendance"("date");
CREATE INDEX "TeacherAttendance_method_idx" ON "TeacherAttendance"("method");
ALTER TABLE "TeacherAttendance"
  ADD CONSTRAINT "TeacherAttendance_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Settings: school start time, late grace period, SMS-on-attendance toggle.
ALTER TABLE "Setting" ADD COLUMN "schoolStartTime" TEXT NOT NULL DEFAULT '08:30';
ALTER TABLE "Setting" ADD COLUMN "lateThresholdMinutes" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "Setting" ADD COLUMN "attendanceSmsEnabled" BOOLEAN NOT NULL DEFAULT true;
