import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

// Vacate: set allocation VACATED and free the room.
export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    const result = await prisma.$transaction(async (tx: typeof prisma) => {
      const alloc = await tx.hostelAllocation.update({ where: { id }, data: { status: "VACATED", vacatedAt: new Date() }, include: { room: true } });
      await tx.hostelRoom.update({ where: { id: alloc.roomId }, data: { status: "AVAILABLE" } });
      return alloc;
    });
    return ok(result);
  } catch (e) { return handleError(e); }
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    await prisma.hostelAllocation.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
}
