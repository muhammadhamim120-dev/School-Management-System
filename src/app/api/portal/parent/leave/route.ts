import { ok, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { withTenantContext } from "@/lib/api-helpers";
import { tenantWhere } from "@/lib/tenant";

/**
 * Session-based parent leave requests (replaces the retired token-gated
 * /api/portal/overview). Returns leave requests across the parent's children.
 */
export const GET = withTenantContext(async () => {
  try {
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.error;

    const parent = await prisma.parent.findFirst({
      where: tenantWhere({ email: auth.user.email }),
      select: { id: true },
    });
    if (!parent) return ok({ leaves: [] });

    const children = await prisma.student.findMany({
      where: tenantWhere({ parentId: parent.id }),
      select: { id: true, fullName: true },
    });
    if (children.length === 0) return ok({ leaves: [] });

    const nameById = new Map(children.map((c) => [c.id, c.fullName]));
    const leaves = await prisma.leaveRequest.findMany({
      where: tenantWhere({ studentId: { in: children.map((c) => c.id) } }),
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return ok({
      leaves: leaves.map((l) => ({
        id: l.id,
        studentName: nameById.get(l.studentId) ?? "",
        fromDate: l.fromDate.toISOString(),
        toDate: l.toDate.toISOString(),
        reason: l.reason,
        status: l.status,
        reviewNote: l.reviewNote,
      })),
    });
  } catch (e) {
    return handleError(e);
  }
});
