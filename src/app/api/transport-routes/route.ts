import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { transportRouteSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const where = search ? { OR: [
      { name: { contains: search, mode: "insensitive" as const } },
      { code: { contains: search, mode: "insensitive" as const } },
    ] } : {};
    const [items, total] = await Promise.all([
      prisma.transportRoute.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" },
        include: { vehicle: { include: { driver: true } }, stops: { orderBy: { sequence: "asc" } }, _count: { select: { assignments: true } } } }),
      prisma.transportRoute.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
}
export async function POST(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const data = transportRouteSchema.parse(await req.json());
    const route = await prisma.transportRoute.create({ data: {
      name: data.name, code: data.code, fare: data.fare, vehicleId: data.vehicleId || null,
      stops: { create: (data.stops ?? []).map((s, i) => ({ name: s.name, sequence: s.sequence ?? i, pickupTime: s.pickupTime || null })) },
    }, include: { vehicle: { include: { driver: true } }, stops: true, _count: { select: { assignments: true } } } });
    return created(route);
  } catch (e) { return handleError(e); }
}
