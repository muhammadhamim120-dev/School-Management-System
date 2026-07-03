import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { smsAvailability } from "@/services/sms";
import { MAX_SMS_ATTEMPTS } from "@/lib/sms";

export async function GET(_req: NextRequest) {
  try {
    const [templates, totalMessages, statusAgg, sentAgg, categoryAgg, deliveryAgg, retryQueue] = await Promise.all([
      prisma.smsTemplate.count(),
      prisma.smsMessage.count(),
      prisma.smsMessage.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.smsMessage.aggregate({ _sum: { sentCount: true, totalCount: true, deliveredCount: true, failedCount: true } }),
      prisma.smsMessage.groupBy({ by: ["category"], _count: { _all: true } }),
      prisma.smsRecipient.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.smsRecipient.count({ where: { status: "FAILED", attempts: { lt: MAX_SMS_ATTEMPTS } } }),
    ]);
    return ok({
      templates, totalMessages,
      totalSent: sentAgg._sum.sentCount ?? 0,
      totalDelivered: sentAgg._sum.deliveredCount ?? 0,
      totalFailed: sentAgg._sum.failedCount ?? 0,
      totalRecipients: sentAgg._sum.totalCount ?? 0,
      retryQueue,
      statusBreakdown: statusAgg.map((s: { status: string; _count: { _all: number } }) => ({ status: s.status, count: s._count._all })),
      categoryBreakdown: categoryAgg.map((c: { category: string; _count: { _all: number } }) => ({ category: c.category, count: c._count._all })),
      deliveryBreakdown: deliveryAgg.map((d: { status: string; _count: { _all: number } }) => ({ status: d.status, count: d._count._all })),
      provider: smsAvailability(),
    });
  } catch (e) { return handleError(e); }
}
