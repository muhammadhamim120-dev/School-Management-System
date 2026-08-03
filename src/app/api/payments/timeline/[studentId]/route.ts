import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";

// Chronological payment activity for one student across all their invoices.
export const GET = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) => {
  try {
    const { studentId } = await params;

    const invoices = await prisma.invoice.findMany({ where: tenantWhere({ studentId }), select: { id: true, invoiceNo: true, total: true, paidTotal: true, status: true } });
    const invoiceIds = invoices.map((i: { id: string }) => i.id);

    const [payments, transactions] = await Promise.all([
      invoiceIds.length ? prisma.payment.findMany({ where: tenantWhere({ invoiceId: { in: invoiceIds } }), orderBy: { createdAt: "desc" } }) : [],
      invoiceIds.length ? prisma.paymentTransaction.findMany({ where: { invoiceId: { in: invoiceIds } }, orderBy: { createdAt: "desc" }, take: 100 }) : [],
    ]);

    const totalPaid = payments.reduce((s: number, p: { amount: number; refundedAmount: number }) => s + (p.amount - (p.refundedAmount ?? 0)), 0);
    const totalBilled = invoices.reduce((s: number, i: { total: number }) => s + i.total, 0);

    return ok({
      invoices, payments, transactions,
      totals: { billed: totalBilled, paid: totalPaid, outstanding: Math.max(0, totalBilled - totalPaid) },
    });
  } catch (e) { return handleError(e); }
});
