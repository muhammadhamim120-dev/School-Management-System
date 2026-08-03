import { ok, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { withTenantContext } from "@/lib/api-helpers";
import { tenantWhere } from "@/lib/tenant";

/**
 * Session-based parent messages (replaces the retired token-gated
 * /api/portal/overview). Returns teacher↔parent messages across the parent's
 * children. The parent is resolved from the logged-in user's email.
 */
export const GET = withTenantContext(async () => {
  try {
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.error;

    const parent = await prisma.parent.findFirst({
      where: tenantWhere({ email: auth.user.email }),
      select: { id: true },
    });
    if (!parent) return ok({ messages: [] });

    const children = await prisma.student.findMany({
      where: tenantWhere({ parentId: parent.id }),
      select: { id: true, fullName: true },
    });
    if (children.length === 0) return ok({ messages: [] });

    const nameById = new Map(children.map((c) => [c.id, c.fullName]));
    const messages = await prisma.parentMessage.findMany({
      where: tenantWhere({ studentId: { in: children.map((c) => c.id) } }),
      include: { teacher: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return ok({
      messages: messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
        studentName: nameById.get(m.studentId) ?? "",
        teacherName: m.teacher?.fullName ?? null,
        readAt: m.readAt ? m.readAt.toISOString() : null,
      })),
    });
  } catch (e) {
    return handleError(e);
  }
});
