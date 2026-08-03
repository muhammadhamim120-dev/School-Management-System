import { ok, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { withTenantContext } from "@/lib/api-helpers";
import { tenantWhere } from "@/lib/tenant";
import { computeGpa } from "@/lib/grading";
import type { LoanStatus } from "@prisma/client";

const WEEKDAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;

/**
 * Session-based student dashboard overview (replaces the retired token-gated
 * /api/portal/overview). The student is resolved from the logged-in user's email.
 * Returns a flat shape the /student dashboard consumes directly.
 */
export const GET = withTenantContext(async () => {
  try {
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.error;
    if (auth.user.role !== "STUDENT") return ok(null);

    const student = await prisma.student.findFirst({
      where: tenantWhere({ email: auth.user.email }),
      include: { class: true, section: true },
    });
    if (!student) return ok(null);

    const today = WEEKDAYS[new Date().getDay()];
    const sectionOr = [{ sectionId: student.sectionId }, { sectionId: null }];

    const [attendance, results, fees, homeworkCount, slots, notices, libraryLoans] = await Promise.all([
      prisma.attendance.groupBy({
        by: ["status"],
        where: tenantWhere({ studentId: student.id }),
        _count: { _all: true },
      }),
      // Result has no schoolId column; scoped via the (tenant-checked) student.
      prisma.result.findMany({
        where: { studentId: student.id },
        include: { exam: true },
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.fee.findMany({ where: tenantWhere({ studentId: student.id }) }),
      student.classId
        ? prisma.homework.count({ where: tenantWhere({ classId: student.classId, OR: sectionOr }) })
        : Promise.resolve(0),
      student.classId
        ? prisma.routineSlot.findMany({
            where: tenantWhere({ classId: student.classId, OR: sectionOr, day: today }),
            include: { subject: true },
            orderBy: { startTime: "asc" },
          })
        : Promise.resolve([]),
      prisma.notice.findMany({
        where: tenantWhere(),
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: 6,
      }),
      // BookLoan has no schoolId column; scoped via the student.
      prisma.bookLoan.count({
        where: { studentId: student.id, status: { in: ["ISSUED", "OVERDUE"] as LoanStatus[] } },
      }),
    ]);

    const attendanceSummary: Record<string, number> = {};
    for (const a of attendance) attendanceSummary[a.status] = a._count._all;
    const totalDays = Object.values(attendanceSummary).reduce((s, n) => s + n, 0);
    const present = (attendanceSummary.PRESENT ?? 0) + (attendanceSummary.LATE ?? 0);
    const attendanceRate = totalDays > 0 ? Math.round((present / totalDays) * 100) : null;

    let gpa: { exam: string; gpa: number; grade: string } | null = null;
    if (results.length) {
      const latestExam = results[0].exam?.name;
      const examResults = results.filter((r) => r.exam?.name === latestExam);
      const subjects = examResults.map((r) => ({ percentage: (r.marks / (r.totalMarks || 100)) * 100 }));
      if (subjects.length) {
        const g = computeGpa(subjects);
        gpa = { exam: latestExam ?? "Latest exam", gpa: g.gpa, grade: g.overallGrade };
      }
    }

    const outstandingFees = fees
      .filter((f) => f.status !== "PAID")
      .reduce((s, f) => s + Math.max(0, f.amount - f.paidAmount), 0);

    return ok({
      name: student.fullName,
      studentId: student.studentId,
      className: student.class?.name ?? null,
      section: student.section?.name ?? null,
      attendanceRate,
      attendanceSummary,
      gpa,
      outstandingFees,
      homeworkCount,
      todaySchedule: slots.map((s) => ({
        subject: s.subject?.name ?? "—",
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room ?? null,
      })),
      recentNotices: notices.map((n) => ({
        id: n.id,
        title: n.title,
        pinned: n.pinned,
        createdAt: n.createdAt.toISOString(),
      })),
      libraryLoans,
    });
  } catch (e) {
    return handleError(e);
  }
});
