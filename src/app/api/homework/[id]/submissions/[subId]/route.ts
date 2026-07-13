import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { homeworkGradeSchema } from "@/lib/validations";
import { withTenantContext } from "@/lib/api-helpers";

// PATCH — grade a submission (marks + feedback). Marks out of totalMarks.
// Once graded, status moves to GRADED (or RETURNED if feedback is provided).
export const PATCH = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string; subId: string }> }) => {
  try {
    const { subId } = await params;
    const data = homeworkGradeSchema.parse(await req.json());
    if (data.marks > data.totalMarks) return fail("Marks cannot exceed total marks", 400);
    const updated = await prisma.homeworkSubmission.update({
      where: { id: subId },
      data: {
        marks: data.marks,
        totalMarks: data.totalMarks,
        feedback: data.feedback,
        status: data.feedback ? "RETURNED" : "GRADED",
        gradedAt: new Date(),
      },
      include: { student: { include: { class: true, section: true } } },
    });
    return ok(updated);
  } catch (e) { return handleError(e); }
});

export const DELETE = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string; subId: string }> }) => {
  try {
    const { subId } = await params;
    await prisma.homeworkSubmission.delete({ where: { id: subId } });
    return ok({ id: subId });
  } catch (e) { return handleError(e); }
});
