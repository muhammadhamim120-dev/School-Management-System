import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError } from "@/lib/api";
import { resultSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

function gradeFor(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

export async function GET(req: NextRequest) {
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
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const data = resultSchema.parse(await req.json());
    const grade = gradeFor((data.marks / data.totalMarks) * 100);
    const result = await prisma.result.upsert({
      where: { studentId_examId_subjectId: { studentId: data.studentId, examId: data.examId, subjectId: data.subjectId } },
      update: { marks: data.marks, totalMarks: data.totalMarks, grade },
      create: { ...data, grade },
      include: { student: true, exam: true, subject: true },
    });
    return created(result);
  } catch (e) { return handleError(e); }
}
