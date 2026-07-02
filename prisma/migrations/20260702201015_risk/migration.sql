-- AI Dropout Risk module migration (additive).

CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "level" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "attendanceRate" DOUBLE PRECISION,
    "duesAmount" DOUBLE PRECISION,
    "avgResult" DOUBLE PRECISION,
    "factors" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RiskAssessment_studentId_idx" ON "RiskAssessment"("studentId");
CREATE INDEX "RiskAssessment_level_idx" ON "RiskAssessment"("level");
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
