import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { requireAppAuth, serverTime } from "@/lib/app-api";
import { computeGpa } from "@/lib/grading";

// GET -- profile + home-screen summary for the authenticated parent/child.
export async function GET(req: NextRequest) {
  try {
    const auth = requireAppAuth(req);
    if (!auth.ok) return fail("Unauthorized.", auth.status);
    const student = await prisma.student.findUnique({
      where: { id: auth.studentId },
      include: { class: true, section: true, parent: true },
    });
    if (!student) return fail("Student not found.", 404);

    const [att, invoices, results] = await Promise.all([
      prisma.attendance.groupBy({ by: ["status"], where: { studentId: student.id }, _count: { _all: true } }),
      prisma.invoice.findMany({ where: { studentId: student.id }, select: { total: true, paidTotal: true, status: true } }),
      prisma.result.findMany({ where: { studentId: student.id }, select: { marks: true, totalMarks: true } }),
    ]);
    const attMap: Record<string, number> = {};
    for (const a of att as { status: string; _count: { _all: number } }[]) attMap[a.status] = a._count._all;
    const attTotal = Object.values(attMap).reduce((s, n) => s + n, 0);
    const attendanceRate = attTotal > 0 ? Math.round(((attMap.PRESENT ?? 0) + (attMap.LATE ?? 0)) / attTotal * 100) : null;
    const outstanding = invoices
      .filter((i) => i.status !== "PAID" && i.status !== "CANCELLED")
      .reduce((s, i) => s + Math.max(0, (i.total ?? 0) - (i.paidTotal ?? 0)), 0);
    const gpa = results.length ? computeGpa(results.map((r) => ({ percentage: (r.marks / (r.totalMarks || 100)) * 100 }))).gpa : null;

    return ok({
      serverTime: serverTime(),
      profile: {
        id: student.id, studentId: student.studentId, name: student.fullName, photo: student.photo,
        class: student.class?.name ?? null, section: student.section?.name ?? null,
        roll: student.rollNumber ?? null, guardian: student.parent?.fullName ?? student.guardianName ?? null,
        guardianPhone: student.parent?.phone ?? student.phone ?? null,
      },
      summary: { attendanceRate, outstanding, gpa },
    });
  } catch (e) { return handleError(e); }
}
