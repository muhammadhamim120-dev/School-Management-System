import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { requireTenantAuth } from "@/lib/api-auth";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";
import { PLAN_LIMITS } from "@/lib/subscription";

export const GET = withTenantContext(async () => {
  try {
    const auth = await requireTenantAuth();
    if (!auth.authenticated) return auth.error;

    const schoolId = getRequiredTenantId();
    const sub = await prisma.subscription.findUnique({
      where: { organizationId: schoolId },
    });

    const tier = sub?.tier ?? "FREE";
    const limits = PLAN_LIMITS[tier];

    const [studentCount, teacherCount] = await Promise.all([
      prisma.student.count({ where: { schoolId } }),
      prisma.teacher.count({ where: { schoolId } }),
    ]);

    return ok({
      subscription: sub ?? { tier: "FREE", status: "TRIAL", monthlyPrice: 0 },
      limits,
      usage: {
        students: { current: studentCount, max: limits.maxStudents },
        teachers: { current: teacherCount, max: limits.maxTeachers },
      },
    });
  } catch (e) {
    return handleError(e);
  }
});
