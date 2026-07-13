-- Certificate generator: persistent certificate records with QR verification.

CREATE TYPE "CertificateType" AS ENUM ('TRANSFER', 'CHARACTER', 'BONAFIDE', 'MARKSHEET');
CREATE TYPE "CertificateStatus" AS ENUM ('ISSUED', 'REVOKED');

CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "certificateNo" TEXT NOT NULL,
    "type" "CertificateType" NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "className" TEXT,
    "sectionName" TEXT,
    "rollNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "guardianName" TEXT,
    "admissionDate" TIMESTAMP(3),
    "payload" JSONB,
    "examId" TEXT,
    "examName" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedBy" TEXT,
    "issuedByTitle" TEXT,
    "signatureUrl" TEXT,
    "token" TEXT NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'ISSUED',
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "hash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Certificate_certificateNo_key" ON "Certificate"("certificateNo");
CREATE UNIQUE INDEX "Certificate_token_key" ON "Certificate"("token");
CREATE INDEX "Certificate_studentId_idx" ON "Certificate"("studentId");
CREATE INDEX "Certificate_type_idx" ON "Certificate"("type");
ALTER TABLE "Certificate"
  ADD CONSTRAINT "Certificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Default certificate signatory on Settings.
ALTER TABLE "Setting" ADD COLUMN "principalName" TEXT;
ALTER TABLE "Setting" ADD COLUMN "principalTitle" TEXT NOT NULL DEFAULT 'Principal';
ALTER TABLE "Setting" ADD COLUMN "signatureUrl" TEXT;
