import { ok, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";
import { tenantWhere } from "@/lib/tenant";
import { computeGpa } from "@/lib/grading";

export const GET = withTenantContext(async () => {
  try {
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.error;
    if (auth.user.role !== "STUDENT") return ok({ gpa: null, results: [] });

    const student = await prisma.student.findFirst({
      where: tenantWhere({ email: auth.user.email }),
      select: { id: true },
    });

    if (!student) return ok({ gpa: null, results: [] });

    const results = await prisma.result.findMany({
      where: tenantWhere({ studentId: student.id }),
      include: { exam: true, subject: true },
      orderBy: { createdAt: "desc" },
    });

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
