import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { coachingBatchSchema } from "@/lib/validations";
import { withTenantContext } from "@/lib/api-helpers";

// GET — batch detail with enrollments (students) + counts.
export const GET = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const batch = await prisma.coachingBatch.findUnique({
      where: { id },
      include: {
        subject: true, teacher: true,
        enrollments: { include: { student: { include: { class: true } } }, orderBy: { enrolledAt: "desc" } },
        _count: { select: { enrollments: true } },
      },
    });
    if (!batch) return handleError({ code: "P2025" });
    return ok(batch);
  } catch (e) { return handleError(e); }
});

export const PATCH = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const data = coachingBatchSchema.partial().parse(await req.json());
    const batch = await prisma.coachingBatch.update({ where: { id }, data, include: { subject: true, teacher: true } });
    return ok(batch);
  } catch (e) { return handleError(e); }
});

export const DELETE = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    await prisma.coachingBatch.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
});
