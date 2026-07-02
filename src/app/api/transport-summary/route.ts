import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { trackingConfigured } from "@/services/tracking";

export async function GET(_req: NextRequest) {
  try {
    const [totalVehicles, totalRoutes, totalDrivers, riders, vehicleStatus] = await Promise.all([
      prisma.vehicle.count(),
      prisma.transportRoute.count(),
      prisma.driver.count(),
      prisma.studentTransport.count({ where: { status: "ACTIVE" } }),
      prisma.vehicle.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    return ok({
      totalVehicles, totalRoutes, totalDrivers, riders,
      vehicleStatus: vehicleStatus.map((v: { status: string; _count: { _all: number } }) => ({ status: v.status, count: v._count._all })),
      trackingConfigured: trackingConfigured(),
    });
  } catch (e) { return handleError(e); }
}
