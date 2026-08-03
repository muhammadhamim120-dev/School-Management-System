import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { requireAppAuth, sinceParam, serverTime } from "@/lib/app-api";
import { computeGpa, pointForPercentage } from "@/lib/grading";
import { runWithTenant } from "@/lib/tenant-context";
import { tenantWhere } from "@/lib/tenant";

// GET — exam results + GPA for the child. ?since= for deltas.
export async function GET(req: NextRequest) {
  try {
    const auth = requireAppAuth(req);
    if (!auth.ok) return fail("Unauthorized.", auth.status);

    const student = await prisma.student.findUnique({ where: { id: auth.studentId }, select: { schoolId: true } });
    if (!student) return fail("Student not found.", 404);

    return runWithTenant({ schoolId: student.schoolId }, async () => {
      const since = sinceParam(req);
      const items = await prisma.result.findMany({
        // Result has no schoolId column; it is tenant-scoped via the student.
        where: { studentId: auth.studentId, ...(since ? { createdAt: { gte: since } } : {}) },
        include: { exam: true, subject: true },
        orderBy: { createdAt: "desc" },
      });
      const gpa = items.length
        ? computeGpa(items.map((r) => ({ percentage: (r.marks / (r.totalMarks || 100)) * 100 }))).gpa
        : null;
      const summary = items.map((r) => ({
        id: r.id, exam: r.exam?.name ?? null, subject: r.subject?.name ?? null,
        marks: r.marks, totalMarks: r.totalMarks, grade: r.grade,
        point: pointForPercentage((r.marks / (r.totalMarks || 100)) * 100),
      }));
      return ok({ serverTime: serverTime(), gpa, items: summary });
    });
  } catch (e) { return handleError(e); }
}
