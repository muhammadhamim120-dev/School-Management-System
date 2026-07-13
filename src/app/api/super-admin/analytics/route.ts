import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/api-auth";

export const GET = async (req: NextRequest) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const [
      totalSchools,
      activeSchools,
      suspendedSchools,
      totalUsers,
      activeSubscriptions,
      totalStudents,
      totalTeachers,
      subscriptionBreakdown,
      recentSignups,
      mrrResult,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { status: "ACTIVE" } }),
      prisma.organization.count({ where: { status: "SUSPENDED" } }),
      prisma.user.count(),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.subscription.groupBy({ by: ["tier"], _count: true, _sum: { monthlyPrice: true } }),
      prisma.organization.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, createdAt: true, status: true },
      }),
      prisma.subscription.aggregate({ _sum: { monthlyPrice: true }, where: { status: "ACTIVE" } }),
    ]);

    return ok({
      totalSchools,
      activeSchools,
      suspendedSchools,
      totalUsers,
      totalStudents,
      totalTeachers,
      activeSubscriptions,
      mrr: mrrResult._sum.monthlyPrice ?? 0,
      subscriptionBreakdown: subscriptionBreakdown.map((s) => ({
        tier: s.tier,
        count: s._count,
        revenue: s._sum.monthlyPrice ?? 0,
      })),
      recentSignups,
    });
  } catch (e) {
    return handleError(e);
  }
};
