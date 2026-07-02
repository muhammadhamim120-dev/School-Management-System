import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { hostelAllocationSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
    const sp = req.nextUrl.searchParams;
    const roomId = sp.get("roomId")?.trim();
    const status = sp.get("status")?.trim();
    const AND: Record<string, unknown>[] = [];
    if (roomId) AND.push({ roomId });
    if (status) AND.push({ status });
    const where = AND.length ? { AND } : {};
    const [items, total] = await Promise.all([
      prisma.hostelAllocation.findMany({ where, skip, take: limit, orderBy: { allocatedAt: "desc" },
        include: { room: { include: { building: true } }, student: true } }),
      prisma.hostelAllocation.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
}
export async function POST(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const data = hostelAllocationSchema.parse(await req.json());
    const alloc = await prisma.$transaction(async (tx: typeof prisma) => {
      const room = await tx.hostelRoom.findUnique({ where: { id: data.roomId }, include: { allocations: { where: { status: "ACTIVE" } } } });
      if (!room) throw { code: "P2025" };
      if (room.allocations.length >= room.capacity) throw { code: "CONFLICT", message: "This room is at full capacity." };
      const created = await tx.hostelAllocation.create({ data: { roomId: data.roomId, studentId: data.studentId, status: "ACTIVE" },
        include: { room: { include: { building: true } }, student: true } });
      if (room.allocations.length + 1 >= room.capacity) await tx.hostelRoom.update({ where: { id: room.id }, data: { status: "FULL" } });
      return created;
    });
    return created(alloc);
  } catch (e) { return handleError(e); }
}
