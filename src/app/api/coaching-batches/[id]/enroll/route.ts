import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { batchEnrollmentSchema } from "@/lib/validations";
import { withTenantContext } from "@/lib/api-helpers";

// POST { studentIds: string[] } — enroll students into a batch (skip dupes).
export const POST = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id: batchId } = await params;
    const { studentIds } = batchEnrollmentSchema.parse(await req.json());

    const batch = await prisma.coachingBatch.findUnique({ where: { id: batchId }, select: { capacity: true } });
    if (!batch) return handleError({ code: "P2025" });

    const existing = await prisma.batchEnrollment.findMany({ where: { batchId }, select: { studentId: true } });
    const already = new Set(existing.map((e) => e.studentId));
    const fresh = studentIds.filter((sid) => !already.has(sid));

    const activeCount = await prisma.batchEnrollment.count({ where: { batchId, status: "ACTIVE" } });
    const room = batch.capacity - activeCount;
    if (fresh.length > room) return fail(`Capacity exceeded. Only ${room} seat(s) left.`, 409);

    if (fresh.length === 0) return ok({ created: 0 });
    await prisma.batchEnrollment.createMany({
      data: fresh.map((studentId) => ({ batchId, studentId })),
    });
    return ok({ created: fresh.length });
  } catch (e) { return handleError(e); }
});

// DELETE ?studentId= — drop a student from a batch.
export const DELETE = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id: batchId } = await params;
    const studentId = req.nextUrl.searchParams.get("studentId");
    if (!studentId) return fail("Missing studentId.", 400);
    await prisma.batchEnrollment.delete({ where: { batchId_studentId: { batchId, studentId } } });
    return ok({ dropped: true });
  } catch (e) { return handleError(e); }
});
