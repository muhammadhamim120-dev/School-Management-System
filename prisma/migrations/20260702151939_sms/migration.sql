-- SMS module migration (additive).

CREATE TYPE "SmsStatus" AS ENUM ('DRAFT', 'QUEUED', 'SENT', 'FAILED');
CREATE TYPE "SmsAudience" AS ENUM ('ALL', 'STUDENTS', 'PARENTS', 'TEACHERS', 'CUSTOM');

-- SmsTemplate
CREATE TABLE "SmsTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SmsTemplate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SmsTemplate_name_key" ON "SmsTemplate"("name");

-- SmsMessage
CREATE TABLE "SmsMessage" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "audience" "SmsAudience" NOT NULL DEFAULT 'CUSTOM',
    "status" "SmsStatus" NOT NULL DEFAULT 'DRAFT',
    "templateId" TEXT,
    "provider" TEXT,
    "sentAt" TIMESTAMP(3),
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SmsMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SmsMessage_status_idx" ON "SmsMessage"("status");
ALTER TABLE "SmsMessage" ADD CONSTRAINT "SmsMessage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SmsTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SmsRecipient
CREATE TABLE "SmsRecipient" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "status" "SmsStatus" NOT NULL DEFAULT 'QUEUED',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SmsRecipient_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SmsRecipient_messageId_idx" ON "SmsRecipient"("messageId");
ALTER TABLE "SmsRecipient" ADD CONSTRAINT "SmsRecipient_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "SmsMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
