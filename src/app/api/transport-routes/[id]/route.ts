import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { transportRouteSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const route = await prisma.transportRoute.findUnique({ where: { id },
      include: { vehicle: { include: { driver: true } }, stops: { orderBy: { sequence: "asc" } }, assignments: { include: { student: true, stop: true } } } });
    if (!route) return handleError({ code: "P2025" });
    return ok(route);
  } catch (e) { return handleError(e); }
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    const data = transportRouteSchema.partial().parse(await req.json());
    // Replace stops if provided.
    if (data.stops) {
      await prisma.routeStop.deleteMany({ where: { routeId: id } });
      await prisma.routeStop.createMany({ data: data.stops.map((s, i) => ({ routeId: id, name: s.name, sequence: s.sequence ?? i, pickupTime: s.pickupTime || null })) });
    }
    const { stops: _s, ...rest } = data; void _s;
    const route = await prisma.transportRoute.update({ where: { id }, data: { ...rest, vehicleId: rest.vehicleId || null },
      include: { vehicle: { include: { driver: true } }, stops: { orderBy: { sequence: "asc" } } } });
    return ok(route);
  } catch (e) { return handleError(e); }
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    await prisma.transportRoute.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
}
