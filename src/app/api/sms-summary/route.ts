import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { smsAvailability } from "@/services/sms";

export async function GET(_req: NextRequest) {
  try {
    const [templates, totalMessages, statusAgg, sentAgg] = await Promise.all([
      prisma.smsTemplate.count(),
      prisma.smsMessage.count(),
      prisma.smsMessage.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.smsMessage.aggregate({ _sum: { sentCount: true, totalCount: true } }),
    ]);
    return ok({
      templates, totalMessages,
      totalSent: sentAgg._sum.sentCount ?? 0,
      totalRecipients: sentAgg._sum.totalCount ?? 0,
      statusBreakdown: statusAgg.map((s: { status: string; _count: { _all: number } }) => ({ status: s.status, count: s._count._all })),
      provider: smsAvailability(),
    });
  } catch (e) { return handleError(e); }
}
