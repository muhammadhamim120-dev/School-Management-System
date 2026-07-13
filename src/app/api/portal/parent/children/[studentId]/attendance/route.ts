import { NextRequest } from "next/server";
import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";
import { tenantWhere } from "@/lib/tenant";

export const GET = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) => {
  try {
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.error;

    const { studentId } = await params;

    const parent = await prisma.parent.findFirst({
      where: tenantWhere({ email: auth.user.email }),
    });

    const student = await prisma.student.findFirst({
      where: tenantWhere({ id: studentId, parentId: parent?.id }),
      select: { id: true, fullName: true },
    });

    if (!student) return fail("Student not found or access denied.", 404);

    const [attendance, grouped] = await Promise.all([
      prisma.attendance.findMany({
        where: tenantWhere({ studentId }),
        orderBy: { date: "desc" },
        take: 100,
      }),
      prisma.attendance.groupBy({
        by: ["status"],
        where: tenantWhere({ studentId }),
        _count: { _all: true },
      }),
    ]);

    const summary: Record<string, number> = {};
    let totalDays = 0;
    for (const g of grouped) {
      summary[g.status] = g._count._all;
      totalDays += g._count._all;
    }
    const present = (summary.PRESENT ?? 0) + (summary.LATE ?? 0);
    const rate = totalDays > 0 ? Math.round((present / totalDays) * 100) : null;

    return ok({
      studentName: student.fullName,
      summary,
      totalDays,
      rate,
      records: attendance.map((a) => ({
        id: a.id,
        date: a.date.toISOString(),
        status: a.status,
        remark: a.remark,
      })),
    });
  } catch (e) {
    return handleError(e);
  }
});
