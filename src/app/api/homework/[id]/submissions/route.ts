import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError } from "@/lib/api";
import { homeworkSubmissionSchema } from "@/lib/validations";
import { withTenantContext } from "@/lib/api-helpers";

// GET — all submissions for a homework assignment (with student details).
export const GET = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const items = await prisma.homeworkSubmission.findMany({
      where: { homeworkId: id },
      orderBy: { submittedAt: "desc" },
      include: { student: { include: { class: true, section: true } } },
    });
    return ok({ items, total: items.length });
  } catch (e) { return handleError(e); }
});

// POST — record a submission on behalf of a student. Late submissions (after
// the due date) are flagged LATE automatically.
export const POST = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const data = homeworkSubmissionSchema.parse(await req.json());
    const hw = await prisma.homework.findUnique({ where: { id }, select: { dueDate: true } });
    if (!hw) return handleError({ code: "P2025" });
    const late = new Date() > hw.dueDate;
    const submission = await prisma.homeworkSubmission.upsert({
      where: { homeworkId_studentId: { homeworkId: id, studentId: data.studentId } },
      update: {
        content: data.content, fileUrl: data.fileUrl, fileName: data.fileName,
        status: late ? "LATE" : "SUBMITTED", submittedAt: new Date(),
      },
      create: {
        homeworkId: id, studentId: data.studentId,
        content: data.content, fileUrl: data.fileUrl, fileName: data.fileName,
        totalMarks: 100,
        status: late ? "LATE" : "SUBMITTED",
      },
      include: { student: { include: { class: true, section: true } } },
    });
    return created(submission);
  } catch (e) { return handleError(e); }
});
