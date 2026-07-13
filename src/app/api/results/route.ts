import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError } from "@/lib/api";
import { resultSchema } from "@/lib/validations";
import { gradeForPercentage } from "@/lib/grading";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const examId = req.nextUrl.searchParams.get("examId") || undefined;
    const studentId = req.nextUrl.searchParams.get("studentId") || undefined;
    const where: Record<string, unknown> = {};
    if (examId) where.examId = examId;
    if (studentId) where.studentId = studentId;
    const items = await prisma.result.findMany({
      where, orderBy: { createdAt: "desc" },
      include: { student: true, exam: true, subject: true },
    });
    return ok({ items, total: items.length, page: 1, limit: items.length, totalPages: 1 });
  } catch (e) { return handleError(e); }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const data = resultSchema.parse(await req.json());
    const grade = gradeForPercentage((data.marks / data.totalMarks) * 100);
    const result = await prisma.result.upsert({
      where: { studentId_examId_subjectId: { studentId: data.studentId, examId: data.examId, subjectId: data.subjectId } },
      update: { marks: data.marks, totalMarks: data.totalMarks, grade },
      create: { ...data, grade },
      include: { student: true, exam: true, subject: true },
    });
    return created(result);
  } catch (e) { return handleError(e); }
});
