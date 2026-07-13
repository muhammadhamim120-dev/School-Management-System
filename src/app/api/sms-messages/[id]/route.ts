import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { withTenantContext } from "@/lib/api-helpers";

export const GET = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const msg = await prisma.smsMessage.findUnique({ where: { id }, include: { template: true, recipients: { orderBy: { createdAt: "asc" } } } });
    if (!msg) return handleError({ code: "P2025" });
    return ok(msg);
  } catch (e) { return handleError(e); }
});

export const DELETE = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    await prisma.smsMessage.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
});
