import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { requireTenantAuth } from "@/lib/api-auth";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

export const GET = withTenantContext(async () => {
  try {
    const auth = await requireTenantAuth();
    if (!auth.authenticated) return auth.error;

    const schoolId = getRequiredTenantId();

    const payments = await prisma.payment.findMany({
      where: { schoolId, status: "SUCCESS" },
      orderBy: { receivedAt: "desc" },
      take: 50,
      select: {
        id: true,
        amount: true,
        method: true,
        receivedAt: true,
        note: true,
        invoice: { select: { invoiceNo: true, period: true } },
      },
    });

    const sub = await prisma.subscription.findUnique({
      where: { organizationId: schoolId },
      select: {
        tier: true,
        monthlyPrice: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelAt: true,
      },
    });

    return ok({
      subscription: sub,
      billingHistory: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        date: p.receivedAt,
        description: p.invoice?.period ?? p.note ?? "Subscription payment",
        invoiceNo: p.invoice?.invoiceNo,
      })),
    });
  } catch (e) {
    return handleError(e);
  }
});
