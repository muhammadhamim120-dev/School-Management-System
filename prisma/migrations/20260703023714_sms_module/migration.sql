-- SMS communication module migration (additive).

-- Extend SmsStatus with SENDING + DELIVERED.
ALTER TYPE "SmsStatus" ADD VALUE IF NOT EXISTS 'SENDING';
ALTER TYPE "SmsStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';

-- New SmsCategory enum for message classification.
CREATE TYPE "SmsCategory" AS ENUM ('GENERAL', 'ATTENDANCE', 'FEE_REMINDER', 'RESULT', 'HOLIDAY', 'EMERGENCY', 'ADMISSION', 'OTP');

-- Template category.
ALTER TABLE "SmsTemplate" ADD COLUMN "category" "SmsCategory" NOT NULL DEFAULT 'GENERAL';
CREATE INDEX "SmsTemplate_category_idx" ON "SmsTemplate"("category");

-- Message category + delivered counter.
ALTER TABLE "SmsMessage" ADD COLUMN "category" "SmsCategory" NOT NULL DEFAULT 'GENERAL';
ALTER TABLE "SmsMessage" ADD COLUMN "deliveredCount" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "SmsMessage_category_idx" ON "SmsMessage"("category");

-- Recipient retry + delivery-report fields.
ALTER TABLE "SmsRecipient" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SmsRecipient" ADD COLUMN "lastAttemptAt" TIMESTAMP(3);
ALTER TABLE "SmsRecipient" ADD COLUMN "providerRef" TEXT;
ALTER TABLE "SmsRecipient" ADD COLUMN "deliveredAt" TIMESTAMP(3);
CREATE INDEX "SmsRecipient_status_idx" ON "SmsRecipient"("status");
