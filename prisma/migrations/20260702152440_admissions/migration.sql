-- Admissions module migration (additive).

CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'ADMITTED', 'REJECTED', 'WAITLISTED');

-- AdmissionSession
CREATE TABLE "AdmissionSession" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "classApplied" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "seats" INTEGER NOT NULL DEFAULT 0,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdmissionSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AdmissionSession_name_key" ON "AdmissionSession"("name");

-- Application
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "previousSchool" TEXT,
    "classApplied" TEXT,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "note" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Application_sessionId_idx" ON "Application"("sessionId");
CREATE INDEX "Application_status_idx" ON "Application"("status");
ALTER TABLE "Application" ADD CONSTRAINT "Application_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AdmissionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
