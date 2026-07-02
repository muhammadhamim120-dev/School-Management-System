import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { vehicleSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const status = req.nextUrl.searchParams.get("status")?.trim();
    const AND: Record<string, unknown>[] = [];
    if (search) AND.push({ regNumber: { contains: search, mode: "insensitive" as const } });
    if (status) AND.push({ status });
    const where = AND.length ? { AND } : {};
    const [items, total] = await Promise.all([
      prisma.vehicle.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { driver: true } }),
      prisma.vehicle.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
}
export async function POST(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const data = vehicleSchema.parse(await req.json());
    return created(await prisma.vehicle.create({ data: { ...data, driverId: data.driverId || null }, include: { driver: true } }));
  } catch (e) { return handleError(e); }
}
