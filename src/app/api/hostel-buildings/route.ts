import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { hostelBuildingSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { search } = parsePagination(req.nextUrl.searchParams);
    const where = search ? { name: { contains: search, mode: "insensitive" as const } } : {};
    const items = await prisma.hostelBuilding.findMany({ where, orderBy: { name: "asc" }, include: { _count: { select: { rooms: true } } } });
    return ok({ items, total: items.length, page: 1, limit: items.length, totalPages: 1 });
  } catch (e) { return handleError(e); }
}
export async function POST(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const data = hostelBuildingSchema.parse(await req.json());
    return created(await prisma.hostelBuilding.create({ data: { ...data, gender: data.gender ?? null } }));
  } catch (e) { return handleError(e); }
}
