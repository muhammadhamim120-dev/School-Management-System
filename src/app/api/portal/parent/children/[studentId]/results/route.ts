import { NextRequest } from "next/server";
import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";
import { tenantWhere } from "@/lib/tenant";
import { computeGpa } from "@/lib/grading";

export const GET = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) => {
  try {
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.error;

    const { studentId } = await params;

    const parent = await prisma.parent.findFirst({
      where: tenantWhere({ email: auth.user.email }),
    });

    const student = await prisma.student.findFirst({
      where: tenantWhere({ id: studentId, parentId: parent?.id }),
      select: { id: true, fullName: true },
    });

    if (!student) return fail("Student not found or access denied.", 404);

    const results = await prisma.result.findMany({
      // Result has no schoolId column; it is tenant-scoped via the student.
      where: { studentId },
      include: { exam: true, subject: true },
      orderBy: { createdAt: "desc" },
    });

    // Compute GPA from latest exam
    let gpa: { exam: string; gpa: number; grade: string } | null = null;
    if (results.length) {
      const latestExam = results[0].exam?.name;
      const examResults = results.filter((r) => r.exam?.name === latestExam);
      const subjects = examResults.map((r) => ({
        percentage: (r.marks / (r.totalMarks || 100)) * 100,
      }));
      if (subjects.length) {
        const g = computeGpa(subjects);
        gpa = { exam: latestExam ?? "Latest", gpa: g.gpa, grade: g.overallGrade };
      }
    }

    return ok({
      studentName: student.fullName,
      gpa,
      results: results.map((r) => ({
        id: r.id,
        subject: r.subject?.name ?? "—",
        marks: r.marks,
        totalMarks: r.totalMarks,
        grade: r.grade,
        exam: r.exam?.name ?? null,
      })),
    });
  } catch (e) {
    return handleError(e);
  }
});
