import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { withTenantContext } from "@/lib/api-helpers";

export const GET = withTenantContext(async (_req: NextRequest) => {
  try {
    const [buildings, rooms, capacityAgg, occupants, roomStatus] = await Promise.all([
      prisma.hostelBuilding.count(),
      prisma.hostelRoom.count(),
      prisma.hostelRoom.aggregate({ _sum: { capacity: true } }),
      prisma.hostelAllocation.count({ where: { status: "ACTIVE" } }),
      prisma.hostelRoom.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    const capacity = capacityAgg._sum?.capacity ?? 0;
    return ok({
      buildings, rooms, capacity, occupants,
      vacancies: Math.max(0, capacity - occupants),
      roomStatus: roomStatus.map((r: { status: string; _count: { _all: number } }) => ({ status: r.status, count: r._count._all })),
    });
  } catch (e) { return handleError(e); }
});
