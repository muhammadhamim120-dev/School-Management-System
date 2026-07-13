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
    const schoolId = getRequiredTenantId();

    // Verify parent ownership
    const parent = await prisma.parent.findFirst({
      where: tenantWhere({ email: auth.user.email }),
    });

    const student = await prisma.student.findFirst({
      where: tenantWhere({ id: studentId, parentId: parent?.id }),
      include: { class: true, section: true, parent: true },
    });

    if (!student) return fail("Student not found or access denied.", 404);

    const [attendance, results, fees, homework] = await Promise.all([
      prisma.attendance.groupBy({
        by: ["status"],
        where: tenantWhere({ studentId }),
        _count: { _all: true },
      }),
      prisma.result.findMany({
        where: tenantWhere({ studentId }),
        include: { exam: true, subject: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.fee.findMany({
        where: tenantWhere({ studentId }),
        orderBy: { createdAt: "desc" },
      }),
      student.classId
        ? prisma.homework.findMany({
            where: tenantWhere({
              classId: student.classId,
              OR: [{ sectionId: student.sectionId }, { sectionId: null }],
            }),
            include: { subject: true, teacher: true },
            orderBy: { dueDate: "desc" },
            take: 10,
          })
        : [],
    ]);

    // Attendance
    const attMap: Record<string, number> = {};
    for (const a of attendance) attMap[a.status] = a._count._all;
    const totalDays = Object.values(attMap).reduce((s, n) => s + n, 0);
    const present = (attMap.PRESENT ?? 0) + (attMap.LATE ?? 0);
    const attendanceRate = totalDays > 0 ? Math.round((present / totalDays) * 100) : null;

    // GPA
    let latestGpa: { exam: string; gpa: number; grade: string } | null = null;
    if (results.length) {
      const latestExam = results[0].exam?.name;
      const examResults = results.filter((r) => r.exam?.name === latestExam);
      const subjects = examResults.map((r) => ({
        percentage: (r.marks / (r.totalMarks || 100)) * 100,
      }));
      if (subjects.length) {
        const g = computeGpa(subjects);
        latestGpa = { exam: latestExam ?? "Latest", gpa: g.gpa, grade: g.overallGrade };
      }
    }

    // Outstanding fees
    const outstandingFees = fees
      .filter((f) => f.status !== "PAID")
      .reduce((s, f) => s + Math.max(0, f.amount - f.paidAmount), 0);

    return ok({
      id: student.id,
      name: student.fullName,
      studentId: student.studentId,
      className: student.class?.name ?? null,
      section: student.section?.name ?? null,
      roll: student.rollNumber,
      photo: student.photo,
      attendanceRate,
      attendanceSummary: attMap,
      latestGpa,
      recentResults: results.map((r) => ({
        id: r.id,
        subject: r.subject?.name ?? "—",
        marks: r.marks,
        totalMarks: r.totalMarks,
        grade: r.grade,
        exam: r.exam?.name ?? null,
      })),
      outstandingFees,
      recentHomework: homework.map((h) => ({
        id: h.id,
        title: h.title,
        subject: h.subject?.name ?? null,
        dueDate: h.dueDate.toISOString(),
      })),
    });
  } catch (e) {
    return handleError(e);
  }
});
