import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { getOrSetCache, cacheKeys, CACHE_TTL } from "@/lib/cache";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";

export const GET = withTenantContext(async () => {
  try {
    const dashboardData = await getOrSetCache(
      cacheKeys.dashboard(),
      async () => {
        const schoolWhere = tenantWhere({});
        const [students, teachers, parents, classes, feeAgg, attendance, recentStudents, recentTeachers, recentParents] =
          await Promise.all([
            prisma.student.count({ where: schoolWhere }),
            prisma.teacher.count({ where: schoolWhere }),
            prisma.parent.count({ where: schoolWhere }),
            prisma.class.count({ where: schoolWhere }),
            prisma.fee.aggregate({ _sum: { paidAmount: true } }),
            prisma.attendance.groupBy({ by: ["status"], _count: true, where: schoolWhere }),
            prisma.student.findMany({ where: schoolWhere, take: 5, orderBy: { createdAt: "desc" }, include: { class: true } }),
            prisma.teacher.findMany({ where: schoolWhere, take: 5, orderBy: { createdAt: "desc" } }),
            prisma.parent.findMany({ where: schoolWhere, take: 5, orderBy: { createdAt: "desc" } }),
          ]);

        const totalAtt = attendance.reduce((sum: number, a: { _count: number }) => sum + a._count, 0);
        const present = attendance.find((a: { status: string; _count: number }) => a.status === "PRESENT")?._count ?? 0;
        const attendanceRate = totalAtt ? Math.round((present / totalAtt) * 100) : 0;

        const genderGroups = await prisma.student.groupBy({ by: ["gender"], _count: true, where: schoolWhere });
        const classGroups = await prisma.class.findMany({
          where: schoolWhere,
          select: { name: true, _count: { select: { students: true } } },
          orderBy: { name: "asc" },
        });

        return {
          stats: {
            students, teachers, parents, classes,
            revenue: feeAgg._sum?.paidAmount ?? 0,
            attendanceRate,
          },
          genderDistribution: genderGroups.map((g: { gender: string; _count: number }) => ({ name: g.gender, value: g._count })),
          classDistribution: classGroups.map((c: { name: string; _count: { students: number } }) => ({ name: c.name, students: c._count.students })),
          recentStudents, recentTeachers, recentParents,
        };
      },
      CACHE_TTL.medium
    );

    return ok(dashboardData);
  } catch (e) { return handleError(e); }
});
