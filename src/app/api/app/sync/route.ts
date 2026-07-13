import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { requireAppAuth, sinceParam, serverTime } from "@/lib/app-api";
import { computeGpa } from "@/lib/grading";

// GET ?since=<ISO> -- consolidated delta sync in a single round-trip.
export async function GET(req: NextRequest) {
  try {
    const auth = requireAppAuth(req);
    if (!auth.ok) return fail("Unauthorized.", auth.status);
    const since = sinceParam(req);
    const studentId = auth.studentId;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true, section: true, parent: true },
    });
    if (!student) return fail("Student not found.", 404);

    const schoolId = student.schoolId;

    const [attendance, invoices, payments, homework, results, notices] = await Promise.all([
      prisma.attendance.findMany({
        where: { studentId, ...(since ? { date: { gte: since } } : {}) },
        orderBy: { date: "desc" }, take: since ? undefined : 90,
      }),
      prisma.invoice.findMany({
        where: { studentId, ...(since ? { updatedAt: { gte: since } } : {}) },
        include: { items: true }, orderBy: { createdAt: "desc" },
      }),
      prisma.payment.findMany({
        where: { invoice: { studentId }, ...(since ? { updatedAt: { gte: since } } : {}) },
        orderBy: { receivedAt: "desc" }, take: since ? undefined : 30,
      }),
      prisma.homework.findMany({
        where: student.classId ? {
          classId: student.classId,
          schoolId,
          ...(since ? { updatedAt: { gte: since } } : {}),
          OR: [{ sectionId: null }, ...(student.sectionId ? [{ sectionId: student.sectionId }] : [])],
        } : { id: "never" },
        include: { subject: true, teacher: true },
        orderBy: { dueDate: "desc" }, take: since ? undefined : 50,
      }),
      prisma.result.findMany({
        where: { studentId, ...(since ? { createdAt: { gte: since } } : {}) },
        include: { exam: true, subject: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.notice.findMany({
        where: { schoolId, ...(since ? { updatedAt: { gte: since } } : {}), audience: { in: ["ALL", "PARENTS"] } },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: since ? undefined : 40,
      }),
    ]);

    const outstanding = invoices
      .filter((i) => i.status !== "PAID" && i.status !== "CANCELLED")
      .reduce((s, i) => s + Math.max(0, (i.total ?? 0) - (i.paidTotal ?? 0)), 0);
    const gpa = results.length
      ? computeGpa(results.map((r) => ({ percentage: (r.marks / (r.totalMarks || 100)) * 100 }))).gpa
      : null;

    return ok({
      serverTime: serverTime(),
      cursor: serverTime(),
      since: since?.toISOString() ?? null,
      profile: {
        id: student.id, studentId: student.studentId, name: student.fullName, photo: student.photo,
        class: student.class?.name ?? null, section: student.section?.name ?? null,
        roll: student.rollNumber ?? null, guardian: student.parent?.fullName ?? student.guardianName ?? null,
      },
      summary: { outstanding, gpa },
      deltas: { attendance, invoices, payments, homework, results, notices },
    });
  } catch (e) { return handleError(e); }
}
