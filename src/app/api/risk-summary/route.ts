import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { withTenantContext } from "@/lib/api-helpers";

export const GET = withTenantContext(async (_req: NextRequest) => {
  try {
    const [total, levelAgg, avgAgg, lastComputed, topRisk] = await Promise.all([
      prisma.riskAssessment.count(),
      prisma.riskAssessment.groupBy({ by: ["level"], _count: { _all: true } }),
      prisma.riskAssessment.aggregate({ _avg: { score: true } }),
      prisma.riskAssessment.findFirst({ orderBy: { computedAt: "desc" }, select: { computedAt: true } }),
      prisma.riskAssessment.findMany({ where: { level: "HIGH" }, orderBy: { score: "desc" }, take: 5, include: { student: { include: { class: true } } } }),
    ]);
    return ok({
      total,
      avgScore: Math.round(avgAgg._avg.score ?? 0),
      lastComputed: lastComputed?.computedAt ?? null,
      levels: levelAgg.map((l: { level: string; _count: { _all: number } }) => ({ level: l.level, count: l._count._all })),
      topRisk,
    });
  } catch (e) { return handleError(e); }
});
