import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";

export const GET = withTenantContext(async (_req: NextRequest) => {
  try {
    const [sessions, openSessions, totalApplications, seatsAgg, statusAgg] = await Promise.all([
      prisma.admissionSession.count({ where: tenantWhere() }),
      prisma.admissionSession.count({ where: tenantWhere({ isOpen: true }) }),
      prisma.application.count({ where: tenantWhere() }),
      prisma.admissionSession.aggregate({ _sum: { seats: true }, where: tenantWhere() }),
      prisma.application.groupBy({ by: ["status"], where: tenantWhere(), _count: { _all: true } }),
    ]);
    return ok({
      sessions, openSessions, totalApplications, totalSeats: seatsAgg._sum.seats ?? 0,
      statusBreakdown: statusAgg.map((s: { status: string; _count: { _all: number } }) => ({ status: s.status, count: s._count._all })),
    });
  } catch (e) { return handleError(e); }
});
