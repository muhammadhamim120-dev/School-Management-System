import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";

export async function GET(_req: NextRequest) {
  try {
    const [sessions, openSessions, totalApplications, seatsAgg, statusAgg] = await Promise.all([
      prisma.admissionSession.count(),
      prisma.admissionSession.count({ where: { isOpen: true } }),
      prisma.application.count(),
      prisma.admissionSession.aggregate({ _sum: { seats: true } }),
      prisma.application.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    return ok({
      sessions, openSessions, totalApplications, totalSeats: seatsAgg._sum.seats ?? 0,
      statusBreakdown: statusAgg.map((s: { status: string; _count: { _all: number } }) => ({ status: s.status, count: s._count._all })),
    });
  } catch (e) { return handleError(e); }
}
