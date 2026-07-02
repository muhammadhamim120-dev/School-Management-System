import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { hostelRoomSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
    const buildingId = req.nextUrl.searchParams.get("buildingId")?.trim();
    const where = buildingId ? { buildingId } : {};
    const [items, total] = await Promise.all([
      prisma.hostelRoom.findMany({ where, skip, take: limit, orderBy: { roomNo: "asc" }, include: { building: true, _count: { select: { allocations: true } } } }),
      prisma.hostelRoom.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
}
export async function POST(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const data = hostelRoomSchema.parse(await req.json());
    return created(await prisma.hostelRoom.create({ data, include: { building: true } }));
  } catch (e) { return handleError(e); }
}
