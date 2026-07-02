import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { gatewayAvailability } from "@/services/payments";

export async function GET(_req: NextRequest) {
  try {
    const [agg, statusGroups, payAgg, recentPayments, monthly] = await Promise.all([
      prisma.invoice.aggregate({ _sum: { total: true, paidTotal: true } }),
      prisma.invoice.groupBy({ by: ["status"], _count: { _all: true }, _sum: { total: true, paidTotal: true } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "SUCCESS" } }),
      prisma.payment.findMany({ where: { status: "SUCCESS" }, orderBy: { receivedAt: "desc" }, take: 5, include: { invoice: { include: { student: true } } } }),
      prisma.$queryRaw<{ month: string; total: number }[]>`
        SELECT to_char(date_trunc('month', "receivedAt"), 'YYYY-MM') AS month, COALESCE(SUM("amount"),0)::float AS total
        FROM "Payment" WHERE "status" = 'SUCCESS'
        GROUP BY 1 ORDER BY 1 DESC LIMIT 6`,
    ]);

    const billed = agg._sum.total ?? 0;
    const collected = payAgg._sum.amount ?? 0;
    const outstanding = Math.max(0, billed - (agg._sum.paidTotal ?? 0));

    return ok({
      billed,
      collected,
      outstanding,
      byStatus: statusGroups.map((g: { status: string; _count: { _all: number }; _sum: { total: number | null; paidTotal: number | null } }) => ({ status: g.status, count: g._count._all, total: g._sum.total ?? 0, paid: g._sum.paidTotal ?? 0 })),
      monthly: monthly.reverse(),
      recentPayments,
      gateways: gatewayAvailability(),
    });
  } catch (e) { return handleError(e); }
}
