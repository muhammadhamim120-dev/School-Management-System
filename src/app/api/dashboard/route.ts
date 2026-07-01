import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";

export async function GET() {
  try {
    const [students, teachers, parents, classes, feeAgg, attendance, recentStudents, recentTeachers, recentParents] =
      await Promise.all([
        prisma.student.count(),
        prisma.teacher.count(),
        prisma.parent.count(),
        prisma.class.count(),
        prisma.fee.aggregate({ _sum: { paidAmount: true } }),
        prisma.attendance.groupBy({ by: ["status"], _count: true }),
        prisma.student.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { class: true } }),
        prisma.teacher.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
        prisma.parent.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
      ]);

    const totalAtt = attendance.reduce((sum: number, a: { _count: number }) => sum + a._count, 0);
    const present = attendance.find((a: { status: string; _count: number }) => a.status === "PRESENT")?._count ?? 0;
    const attendanceRate = totalAtt ? Math.round((present / totalAtt) * 100) : 0;

    // gender distribution + class distribution for charts
    const genderGroups = await prisma.student.groupBy({ by: ["gender"], _count: true });
    const classGroups = await prisma.class.findMany({
      select: { name: true, _count: { select: { students: true } } },
      orderBy: { name: "asc" },
    });

    return ok({
      stats: {
        students, teachers, parents, classes,
        revenue: feeAgg._sum.paidAmount ?? 0,
        attendanceRate,
      },
      genderDistribution: genderGroups.map((g: { gender: string; _count: number }) => ({ name: g.gender, value: g._count })),
      classDistribution: classGroups.map((c: { name: string; _count: { students: number } }) => ({ name: c.name, students: c._count.students })),
      recentStudents, recentTeachers, recentParents,
    });
  } catch (e) { return handleError(e); }
}
