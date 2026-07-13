import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { requireAppAuth, sinceParam, serverTime } from "@/lib/app-api";

// GET -- homework for the child's class/section. ?since= for deltas.
export async function GET(req: NextRequest) {
  try {
    const auth = requireAppAuth(req);
    if (!auth.ok) return fail("Unauthorized.", auth.status);
    const since = sinceParam(req);
    const student = await prisma.student.findUnique({ where: { id: auth.studentId }, select: { classId: true, sectionId: true, schoolId: true } });
    if (!student?.classId) return ok({ serverTime: serverTime(), items: [] });
    const items = await prisma.homework.findMany({
      where: {
        classId: student.classId,
        schoolId: student.schoolId,
        ...(since ? { updatedAt: { gte: since } } : {}),
        OR: [{ sectionId: null }, ...(student.sectionId ? [{ sectionId: student.sectionId }] : [])],
      },
      include: {
        subject: true,
        teacher: true,
        submissions: {
          where: { studentId: auth.studentId },
          select: { id: true, status: true, content: true, fileUrl: true, marks: true, totalMarks: true, feedback: true, submittedAt: true },
        },
      },
      orderBy: { dueDate: "desc" },
      take: since ? undefined : 50,
    });
    return ok({ serverTime: serverTime(), items });
  } catch (e) { return handleError(e); }
}
