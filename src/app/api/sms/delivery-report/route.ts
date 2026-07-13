import { NextRequest } from "next/server";
import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { withTenantContext } from "@/lib/api-helpers";

// Provider delivery-report callback (DLR). Public endpoint; correlates by the
// provider's message reference and updates the recipient's delivery status.
export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    let body: { providerRef?: string; status?: string; error?: string };
    try { body = await req.json(); } catch { return fail("Invalid JSON body.", 400); }
    const providerRef = body.providerRef?.trim();
    if (!providerRef) return fail("Missing providerRef.", 400);

    const recipient = await prisma.smsRecipient.findFirst({ where: { providerRef } });
    if (!recipient) return fail("No recipient for that reference.", 404);

    const delivered = String(body.status).toUpperCase() === "DELIVERED";
    await prisma.smsRecipient.update({
      where: { id: recipient.id },
      data: {
        status: delivered ? "DELIVERED" : "FAILED",
        deliveredAt: delivered ? new Date() : null,
        error: delivered ? null : (body.error ?? "Delivery failed"),
      },
    });

    const agg = await prisma.smsRecipient.groupBy({ by: ["status"], where: { messageId: recipient.messageId }, _count: { _all: true } });
    const c: Record<string, number> = {};
    for (const a of agg as { status: string; _count: { _all: number } }[]) c[a.status] = a._count._all;
    await prisma.smsMessage.update({ where: { id: recipient.messageId }, data: {
      deliveredCount: c.DELIVERED ?? 0,
      sentCount: (c.SENT ?? 0) + (c.DELIVERED ?? 0),
      failedCount: c.FAILED ?? 0,
    } });

    return ok({ updated: true });
  } catch (e) { return handleError(e); }
});
