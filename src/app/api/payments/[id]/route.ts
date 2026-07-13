import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { withTenantContext } from "@/lib/api-helpers";

// Deleting/refunding a payment must also recompute the invoice.
export const DELETE = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id } });
      if (!payment) throw { code: "P2025" };
      await tx.payment.delete({ where: { id } });
      const invoice = await tx.invoice.findUnique({ where: { id: payment.invoiceId }, include: { payments: true } });
      if (invoice) {
        const { deriveInvoiceStatus } = await import("@/lib/finance");
        const paidTotal = invoice.payments.filter((p: { status: string; amount: number }) => p.status === "SUCCESS").reduce((s: number, p: { amount: number }) => s + p.amount, 0);
        const status = deriveInvoiceStatus({ total: invoice.total, paidTotal, dueDate: invoice.dueDate, current: invoice.status });
        await tx.invoice.update({ where: { id: invoice.id }, data: { paidTotal, status } });
      }
    });
    return ok({ id });
  } catch (e) { return handleError(e); }
});
