import { NextRequest } from "next/server";
import { ok, fail, handleError } from "@/lib/api";
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

    const schoolId = getRequiredTenantId();

    // Find parent record for this user
    const parent = await prisma.parent.findFirst({
      where: tenantWhere({ email: auth.user.email }),
    });

    if (!parent) {
      return ok({ children: [], totalMessages: 0, pendingLeaves: 0 });
    }

    const children = await prisma.student.findMany({
      where: tenantWhere({ parentId: parent.id }),
      include: { class: true, section: true },
      orderBy: { createdAt: "asc" },
    });

    // Fetch attendance, results, and fees for each child
    const enriched = await Promise.all(
      children.map(async (child) => {
        const [attendance, results, fees] = await Promise.all([
          prisma.attendance.groupBy({
            by: ["status"],
            where: tenantWhere({ studentId: child.id }),
            _count: { _all: true },
          }),
          prisma.result.findMany({
            // Result has no schoolId column; it is tenant-scoped via the student.
            where: { studentId: child.id },
            include: { exam: true },
            orderBy: { createdAt: "desc" },
            take: 60,
          }),
          prisma.fee.findMany({
            where: tenantWhere({ studentId: child.id }),
          }),
        ]);

        // Attendance rate
        const attMap: Record<string, number> = {};
        for (const a of attendance) attMap[a.status] = a._count._all;
        const totalDays = Object.values(attMap).reduce((s, n) => s + n, 0);
        const present = (attMap.PRESENT ?? 0) + (attMap.LATE ?? 0);
        const attendanceRate = totalDays > 0 ? Math.round((present / totalDays) * 100) : null;

        // Latest GPA
        let latestGpa: number | null = null;
        if (results.length) {
          const latestExam = results[0].exam?.name;
          const examResults = results.filter((r) => r.exam?.name === latestExam);
          const subjects = examResults.map((r) => ({
            percentage: (r.marks / (r.totalMarks || 100)) * 100,
          }));
          if (subjects.length) {
            const g = computeGpa(subjects);
            latestGpa = g.gpa;
          }
        }

        // Outstanding fees
        const outstandingFees = fees
          .filter((f) => f.status !== "PAID")
          .reduce((s, f) => s + Math.max(0, f.amount - f.paidAmount), 0);

        return {
          id: child.id,
          name: child.fullName,
          studentId: child.studentId,
          className: child.class?.name ?? null,
          section: child.section?.name ?? null,
          attendanceRate,
          latestGpa,
          outstandingFees,
        };
      })
    );

    // Count messages and pending leaves across all children
    const childIds = children.map((c) => c.id);
    const [messageCount, pendingLeaves] = await Promise.all([
      prisma.parentMessage.count({
        where: tenantWhere({ studentId: { in: childIds } }),
      }),
      prisma.leaveRequest.count({
        where: tenantWhere({ studentId: { in: childIds }, status: "PENDING" as const }),
      }),
    ]);

    return ok({ children: enriched, totalMessages: messageCount, pendingLeaves });
  } catch (e) {
    return handleError(e);
  }
});
