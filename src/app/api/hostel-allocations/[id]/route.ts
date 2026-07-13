import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { withTenantContext } from "@/lib/api-helpers";

// Vacate: set allocation VACATED and free the room.
export const PATCH = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const result = await prisma.$transaction(async (tx) => {
      const alloc = await tx.hostelAllocation.update({ where: { id }, data: { status: "VACATED", vacatedAt: new Date() }, include: { room: true } });
      await tx.hostelRoom.update({ where: { id: alloc.roomId }, data: { status: "AVAILABLE" } });
      return alloc;
    });
    return ok(result);
  } catch (e) { return handleError(e); }
});
export const DELETE = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    await prisma.hostelAllocation.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
});
