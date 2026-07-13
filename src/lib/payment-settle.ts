import { prisma } from "@/lib/prisma";
import { deriveInvoiceStatus } from "@/lib/finance";
import { getRequiredTenantId } from "@/lib/tenant-context";

type GatewayValue = "BKASH" | "NAGAD" | "ROCKET" | "SSLCOMMERZ";
type EventValue = "INITIATE" | "CALLBACK" | "WEBHOOK" | "VERIFY" | "REFUND" | "MANUAL";
type StatusValue = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

/** Record an audit-log transaction. Never stores secrets — payload is caller-sanitized. */
export async function logTransaction(input: {
  paymentId?: string | null;
  invoiceId?: string | null;
  gateway?: GatewayValue | null;
  gatewayRef?: string | null;
  event: EventValue;
  status: StatusValue;
  amount?: number | null;
  payload?: string | null;
  message?: string | null;
}) {
  return prisma.paymentTransaction.create({ data: {
    paymentId: input.paymentId ?? null,
    invoiceId: input.invoiceId ?? null,
    gateway: input.gateway ?? null,
    gatewayRef: input.gatewayRef ?? null,
    event: input.event,
    status: input.status,
    amount: input.amount ?? null,
    payload: input.payload ?? null,
    message: input.message ?? null,
  } });
}

/**
 * Settle a successful gateway payment against an invoice, idempotently.
 * If a Payment with the same gatewayRef already exists, it is not duplicated.
 * Recomputes the invoice paidTotal + status in a single transaction.
 */
export async function settlePayment(input: {
  invoiceId: string;
  amount: number;
  gateway: GatewayValue;
  gatewayRef: string;
  event: EventValue;
}) {
  return prisma.$transaction(async (tx) => {
    // Idempotency: skip if this gatewayRef was already settled.
    const existing = await tx.payment.findFirst({ where: { gatewayRef: input.gatewayRef, gateway: input.gateway } });
    if (existing) {
      await tx.paymentTransaction.create({ data: {
        paymentId: existing.id, invoiceId: input.invoiceId, gateway: input.gateway, gatewayRef: input.gatewayRef,
        event: input.event, status: "SUCCESS", amount: input.amount, message: "Duplicate settlement ignored (idempotent).",
      } });
      return existing;
    }
    const invoice = await tx.invoice.findUnique({ where: { id: input.invoiceId } });
    if (!invoice) throw { code: "P2025" };

    const payment = await tx.payment.create({ data: {
      invoiceId: input.invoiceId, amount: input.amount, method: input.gateway,
      status: "SUCCESS", gateway: input.gateway, gatewayRef: input.gatewayRef,
      schoolId: getRequiredTenantId(),
    } });
    await tx.paymentTransaction.create({ data: {
      paymentId: payment.id, invoiceId: input.invoiceId, gateway: input.gateway, gatewayRef: input.gatewayRef,
      event: input.event, status: "SUCCESS", amount: input.amount,
    } });

    // Recompute invoice paid total from all successful, net-of-refund payments.
    const payments = await tx.payment.findMany({ where: { invoiceId: input.invoiceId, status: { in: ["SUCCESS", "REFUNDED"] } } });
    const paidTotal = payments.reduce((s: number, p: { amount: number; refundedAmount: number }) => s + (p.amount - (p.refundedAmount ?? 0)), 0);
    const status = deriveInvoiceStatus({ total: invoice.total, paidTotal, dueDate: invoice.dueDate, current: invoice.status });
    await tx.invoice.update({ where: { id: input.invoiceId }, data: { paidTotal, status } });
    return payment;
  });
}

/** Recompute an invoice's paidTotal + status after a refund. */
export async function recomputeInvoice(invoiceId: string) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return null;
    const payments = await tx.payment.findMany({ where: { invoiceId, status: { in: ["SUCCESS", "REFUNDED"] } } });
    const paidTotal = payments.reduce((s: number, p: { amount: number; refundedAmount: number }) => s + (p.amount - (p.refundedAmount ?? 0)), 0);
    const status = deriveInvoiceStatus({ total: invoice.total, paidTotal, dueDate: invoice.dueDate, current: invoice.status });
    return tx.invoice.update({ where: { id: invoiceId }, data: { paidTotal, status } });
  });
}
