-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_SETUP');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';
ALTER TYPE "Role" ADD VALUE 'SCHOOL_ADMIN';
ALTER TYPE "Role" ADD VALUE 'PARENT';
ALTER TYPE "Role" ADD VALUE 'STUDENT';
ALTER TYPE "Role" ADD VALUE 'ACCOUNTANT';

-- DropIndex
DROP INDEX "AcademicSession_name_key";

-- DropIndex
DROP INDEX "AdmissionSession_name_key";

-- DropIndex
DROP INDEX "Author_name_key";

-- DropIndex
DROP INDEX "Book_isbn_key";

-- DropIndex
DROP INDEX "BookCategory_name_key";

-- DropIndex
DROP INDEX "Campus_code_key";

-- DropIndex
DROP INDEX "Campus_name_key";

-- DropIndex
DROP INDEX "Class_name_key";

-- DropIndex
DROP INDEX "FeeCategory_name_key";

-- DropIndex
DROP INDEX "FeeStructure_shift_idx";

-- DropIndex
DROP INDEX "HostelBuilding_name_key";

-- DropIndex
DROP INDEX "Invoice_invoiceNo_key";

-- DropIndex
DROP INDEX "Parent_email_key";

-- DropIndex
DROP INDEX "Parent_parentId_key";

-- DropIndex
DROP INDEX "Publisher_name_key";

-- DropIndex
DROP INDEX "Section_shift_idx";

-- DropIndex
DROP INDEX "SmsTemplate_name_key";

-- DropIndex
DROP INDEX "Student_studentId_key";

-- DropIndex
DROP INDEX "Subject_code_key";

-- DropIndex
DROP INDEX "Teacher_email_key";

-- DropIndex
DROP INDEX "Teacher_shift_idx";

-- DropIndex
DROP INDEX "Teacher_teacherId_key";

-- DropIndex
DROP INDEX "TransportRoute_code_key";

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "AcademicSession" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "AdmissionSession" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Author" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "BoardRegistration" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "BookCategory" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "BookCopy" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Campus" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "CoachingBatch" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Concession" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Fee" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "FeeCategory" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "FeeStructure" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Homework" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "HostelBuilding" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Notice" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "OnlineExam" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Parent" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "ParentMessage" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Publisher" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "RiskAssessment" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "RoutineSlot" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "customCss" TEXT,
ADD COLUMN     "schoolId" TEXT,
ADD COLUMN     "theme" JSONB;

-- AlterTable
ALTER TABLE "SmsMessage" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "SmsTemplate" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "TeacherAttendance" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Term" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "TransportRoute" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "schoolId" TEXT;

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "customDomain" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "logo" TEXT,
    "favicon" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "status" "OrgStatus" NOT NULL DEFAULT 'PENDING_SETUP',
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tier" "PlanTier" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "maxStudents" INTEGER NOT NULL DEFAULT 100,
    "maxTeachers" INTEGER NOT NULL DEFAULT 20,
    "maxStorageMb" INTEGER NOT NULL DEFAULT 500,
    "features" JSONB,
    "monthlyPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "billingEmail" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "schoolId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "defaultValue" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_customDomain_key" ON "Organization"("customDomain");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_organizationId_key" ON "Subscription"("organizationId");

-- CreateIndex
CREATE INDEX "Subscription_tier_idx" ON "Subscription"("tier");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "AuditLog_schoolId_idx" ON "AuditLog"("schoolId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "SupportTicket_organizationId_idx" ON "SupportTicket"("organizationId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "AcademicSession_schoolId_idx" ON "AcademicSession"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicSession_schoolId_name_key" ON "AcademicSession"("schoolId", "name");

-- CreateIndex
CREATE INDEX "AdmissionSession_schoolId_idx" ON "AdmissionSession"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionSession_schoolId_name_key" ON "AdmissionSession"("schoolId", "name");

-- CreateIndex
CREATE INDEX "Application_schoolId_idx" ON "Application"("schoolId");

-- CreateIndex
CREATE INDEX "Attendance_schoolId_idx" ON "Attendance"("schoolId");

-- CreateIndex
CREATE INDEX "Author_schoolId_idx" ON "Author"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Author_schoolId_name_key" ON "Author"("schoolId", "name");

-- CreateIndex
CREATE INDEX "BoardRegistration_schoolId_idx" ON "BoardRegistration"("schoolId");

-- CreateIndex
CREATE INDEX "Book_schoolId_idx" ON "Book"("schoolId");

-- CreateIndex
CREATE INDEX "BookCategory_schoolId_idx" ON "BookCategory"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "BookCategory_schoolId_name_key" ON "BookCategory"("schoolId", "name");

-- CreateIndex
CREATE INDEX "BookCopy_schoolId_idx" ON "BookCopy"("schoolId");

-- CreateIndex
CREATE INDEX "Campus_schoolId_idx" ON "Campus"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Campus_schoolId_code_key" ON "Campus"("schoolId", "code");

-- CreateIndex
CREATE INDEX "Certificate_schoolId_idx" ON "Certificate"("schoolId");

-- CreateIndex
CREATE INDEX "Class_schoolId_idx" ON "Class"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Class_schoolId_name_key" ON "Class"("schoolId", "name");

-- CreateIndex
CREATE INDEX "CoachingBatch_schoolId_idx" ON "CoachingBatch"("schoolId");

-- CreateIndex
CREATE INDEX "Concession_schoolId_idx" ON "Concession"("schoolId");

-- CreateIndex
CREATE INDEX "Driver_schoolId_idx" ON "Driver"("schoolId");

-- CreateIndex
CREATE INDEX "Event_schoolId_idx" ON "Event"("schoolId");

-- CreateIndex
CREATE INDEX "Exam_schoolId_idx" ON "Exam"("schoolId");

-- CreateIndex
CREATE INDEX "Fee_schoolId_idx" ON "Fee"("schoolId");

-- CreateIndex
CREATE INDEX "FeeCategory_schoolId_idx" ON "FeeCategory"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeCategory_schoolId_name_key" ON "FeeCategory"("schoolId", "name");

-- CreateIndex
CREATE INDEX "FeeStructure_schoolId_idx" ON "FeeStructure"("schoolId");

-- CreateIndex
CREATE INDEX "Homework_schoolId_idx" ON "Homework"("schoolId");

-- CreateIndex
CREATE INDEX "HostelBuilding_schoolId_idx" ON "HostelBuilding"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "HostelBuilding_schoolId_name_key" ON "HostelBuilding"("schoolId", "name");

-- CreateIndex
CREATE INDEX "Invoice_schoolId_idx" ON "Invoice"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_schoolId_invoiceNo_key" ON "Invoice"("schoolId", "invoiceNo");

-- CreateIndex
CREATE INDEX "LeaveRequest_schoolId_idx" ON "LeaveRequest"("schoolId");

-- CreateIndex
CREATE INDEX "Notice_schoolId_idx" ON "Notice"("schoolId");

-- CreateIndex
CREATE INDEX "OnlineExam_schoolId_idx" ON "OnlineExam"("schoolId");

-- CreateIndex
CREATE INDEX "Parent_schoolId_idx" ON "Parent"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_schoolId_parentId_key" ON "Parent"("schoolId", "parentId");

-- CreateIndex
CREATE INDEX "ParentMessage_schoolId_idx" ON "ParentMessage"("schoolId");

-- CreateIndex
CREATE INDEX "Payment_schoolId_idx" ON "Payment"("schoolId");

-- CreateIndex
CREATE INDEX "Publisher_schoolId_idx" ON "Publisher"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Publisher_schoolId_name_key" ON "Publisher"("schoolId", "name");

-- CreateIndex
CREATE INDEX "Question_schoolId_idx" ON "Question"("schoolId");

-- CreateIndex
CREATE INDEX "RiskAssessment_schoolId_idx" ON "RiskAssessment"("schoolId");

-- CreateIndex
CREATE INDEX "RoutineSlot_schoolId_idx" ON "RoutineSlot"("schoolId");

-- CreateIndex
CREATE INDEX "Section_schoolId_idx" ON "Section"("schoolId");

-- CreateIndex
CREATE INDEX "Setting_schoolId_idx" ON "Setting"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_schoolId_key" ON "Setting"("schoolId");

-- CreateIndex
CREATE INDEX "SmsMessage_schoolId_idx" ON "SmsMessage"("schoolId");

-- CreateIndex
CREATE INDEX "SmsTemplate_schoolId_idx" ON "SmsTemplate"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SmsTemplate_schoolId_name_key" ON "SmsTemplate"("schoolId", "name");

-- CreateIndex
CREATE INDEX "Student_schoolId_idx" ON "Student"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_schoolId_studentId_key" ON "Student"("schoolId", "studentId");

-- CreateIndex
CREATE INDEX "Subject_schoolId_idx" ON "Subject"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_schoolId_code_key" ON "Subject"("schoolId", "code");

-- CreateIndex
CREATE INDEX "Teacher_schoolId_idx" ON "Teacher"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_schoolId_teacherId_key" ON "Teacher"("schoolId", "teacherId");

-- CreateIndex
CREATE INDEX "TeacherAttendance_schoolId_idx" ON "TeacherAttendance"("schoolId");

-- CreateIndex
CREATE INDEX "Term_schoolId_idx" ON "Term"("schoolId");

-- CreateIndex
CREATE INDEX "TransportRoute_schoolId_idx" ON "TransportRoute"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "TransportRoute_schoolId_code_key" ON "TransportRoute"("schoolId", "code");

-- CreateIndex
CREATE INDEX "User_schoolId_idx" ON "User"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_schoolId_key" ON "User"("email", "schoolId");

-- CreateIndex
CREATE INDEX "Vehicle_schoolId_idx" ON "Vehicle"("schoolId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

