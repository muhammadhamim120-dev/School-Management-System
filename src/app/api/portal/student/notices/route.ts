import { ok, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { withTenantContext } from "@/lib/api-helpers";
import { tenantWhere } from "@/lib/tenant";

export const GET = withTenantContext(async () => {
  try {
    const notices = await prisma.notice.findMany({
      where: tenantWhere(),
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 30,
    });

    return ok({
      notices: notices.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        pinned: n.pinned,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    return handleError(e);
  }
});
