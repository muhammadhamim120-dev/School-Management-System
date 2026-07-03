import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { gatewayAvailability } from "@/services/payments";

export async function GET(_req: NextRequest) {
  try {
    const [collectedAgg, refundedAgg, byGateway, byStatus, recent] = await Promise.all([
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: { in: ["SUCCESS", "REFUNDED"] } } }),
      prisma.payment.aggregate({ _sum: { refundedAmount: true } }),
      prisma.payment.groupBy({ by: ["gateway"], _sum: { amount: true }, _count: { _all: true }, where: { gateway: { not: null } } }),
      prisma.payment.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { invoice: { include: { student: true } } } }),
    ]);
    const gross = collectedAgg._sum.amount ?? 0;
    const refunded = refundedAgg._sum.refundedAmount ?? 0;
    return ok({
      grossCollected: gross,
      refunded,
      netCollected: gross - refunded,
      byGateway: byGateway.map((g: { gateway: string | null; _sum: { amount: number | null }; _count: { _all: number } }) => ({
        gateway: g.gateway, amount: g._sum.amount ?? 0, count: g._count._all })),
      byStatus: byStatus.map((s: { status: string; _count: { _all: number } }) => ({ status: s.status, count: s._count._all })),
      recent,
      availability: gatewayAvailability(),
    });
  } catch (e) { return handleError(e); }
}
