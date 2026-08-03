import { NextRequest } from "next/server";
import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { verifyPortalToken } from "@/lib/portal-token";
import { computeGpa } from "@/lib/grading";
import { runWithTenant } from "@/lib/tenant-context";
import { tenantWhere } from "@/lib/tenant";

// PUBLIC (token-gated). All parent-portal data for the verified student.
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const v = verifyPortalToken(token);
    if (!v.ok) return fail("Session expired. Please sign in again.", 401);
    const studentId = v.studentId;

    const student = await prisma.student.findUnique({ where: { id: studentId }, include: { class: true, section: true, parent: true } });
    if (!student) return fail("Student not found.", 404);

    return runWithTenant({ schoolId: student.schoolId }, async () => {
      const [attendance, results, invoices, payments, transport, notices, routine, homework, messages, leaves] = await Promise.all([
        prisma.attendance.groupBy({ by: ["status"], where: tenantWhere({ studentId }), _count: { _all: true } }),
        prisma.result.findMany({ where: { studentId }, include: { exam: true, subject: true }, orderBy: { createdAt: "desc" }, take: 60 }),
        prisma.invoice.findMany({ where: tenantWhere({ studentId }), orderBy: { createdAt: "desc" }, take: 30 }),
        prisma.payment.findMany({ where: tenantWhere({ invoice: { studentId } }), include: { invoice: true }, orderBy: { createdAt: "desc" }, take: 30 }),
        prisma.studentTransport.findMany({ where: { studentId, status: "ACTIVE" as const }, include: { route: true, stop: true } }),
        prisma.notice.findMany({ where: tenantWhere(), orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: 12 }),
        student.classId ? prisma.routineSlot.findMany({ where: tenantWhere({ classId: student.classId, OR: [{ sectionId: student.sectionId }, { sectionId: null }] }), include: { subject: true, teacher: true } }) : [],
        student.classId ? prisma.homework.findMany({ where: tenantWhere({ classId: student.classId, OR: [{ sectionId: student.sectionId }, { sectionId: null }] }), include: { subject: true, teacher: true }, orderBy: { dueDate: "desc" }, take: 30 }) : [],
        prisma.parentMessage.findMany({ where: tenantWhere({ studentId }), include: { teacher: true }, orderBy: { createdAt: "asc" }, take: 100 }),
        prisma.leaveRequest.findMany({ where: tenantWhere({ studentId }), orderBy: { createdAt: "desc" }, take: 30 }),
      ]);

      const attMap: Record<string, number> = {};
      for (const a of attendance as { status: string; _count: { _all: number } }[]) attMap[a.status] = a._count._all;
      const totalDays = Object.values(attMap).reduce((s: number, n: number) => s + n, 0);
      const present = (attMap.PRESENT ?? 0) + (attMap.LATE ?? 0);
      const attendanceRate = totalDays > 0 ? Math.round((present / totalDays) * 100) : null;

      const outstanding = invoices.reduce((s: number, inv: { total: number; paidTotal: number; status: string }) =>
        inv.status === "CANCELLED" || inv.status === "PAID" ? s : s + Math.max(0, inv.total - inv.paidTotal), 0);

      // latest-exam GPA
      let gpa: { exam: string | null; gpa: number; grade: string } | null = null;
      if (results.length) {
        const latestExam = (results[0] as { exam?: { name: string } | null }).exam?.name;
        const subjects = (results as { exam?: { name: string } | null; marks: number; totalMarks: number }[])
          .filter((r) => r.exam?.name === latestExam)
          .map((r) => ({ percentage: (r.marks / (r.totalMarks || 100)) * 100 }));
        if (subjects.length) { const g = computeGpa(subjects); gpa = { exam: latestExam ?? null, gpa: g.gpa, grade: g.overallGrade }; }
      }

      return ok({
        student: { id: student.id, name: student.fullName, studentId: student.studentId, photo: student.photo,
          class: student.class?.name ?? null, section: student.section?.name ?? null, roll: student.rollNumber,
          guardian: student.parent?.fullName ?? null },
        attendance: { summary: attMap, totalDays, rate: attendanceRate },
        results, gpa, invoices, outstanding, payments, transport, notices, routine, homework, messages, leaves,
      });
    });
  } catch (e) { return handleError(e); }
}
