-- Payment gateway module migration (additive).

CREATE TYPE "PaymentEvent" AS ENUM ('INITIATE', 'CALLBACK', 'WEBHOOK', 'VERIFY', 'REFUND', 'MANUAL');

-- Refund support on Payment
ALTER TABLE "Payment" ADD COLUMN "refundedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN "refundedAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN "refundRef" TEXT;
CREATE INDEX "Payment_gatewayRef_idx" ON "Payment"("gatewayRef");

-- PaymentTransaction (audit log)
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT,
    "invoiceId" TEXT,
    "gateway" "PaymentGateway",
    "gatewayRef" TEXT,
    "event" "PaymentEvent" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION,
    "payload" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PaymentTransaction_paymentId_idx" ON "PaymentTransaction"("paymentId");
CREATE INDEX "PaymentTransaction_invoiceId_idx" ON "PaymentTransaction"("invoiceId");
CREATE INDEX "PaymentTransaction_gatewayRef_idx" ON "PaymentTransaction"("gatewayRef");
CREATE INDEX "PaymentTransaction_event_idx" ON "PaymentTransaction"("event");
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
