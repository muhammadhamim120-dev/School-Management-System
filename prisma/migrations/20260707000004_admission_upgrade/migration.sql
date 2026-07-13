-- Admission upgrades: document uploads, admit-card roll, and public tracking.
ALTER TABLE "Application" ADD COLUMN "photoUrl" TEXT;
ALTER TABLE "Application" ADD COLUMN "birthCertUrl" TEXT;
ALTER TABLE "Application" ADD COLUMN "transcriptUrl" TEXT;
ALTER TABLE "Application" ADD COLUMN "admitRoll" TEXT;
ALTER TABLE "Application" ADD COLUMN "trackingCode" TEXT;
CREATE UNIQUE INDEX "Application_trackingCode_key" ON "Application"("trackingCode");

-- Optional admission fee on the session (used when enrolling an approved applicant).
ALTER TABLE "AdmissionSession" ADD COLUMN "admissionFee" DOUBLE PRECISION NOT NULL DEFAULT 0;
