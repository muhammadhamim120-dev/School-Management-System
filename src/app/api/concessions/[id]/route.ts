import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { concessionSchema } from "@/lib/validations";
import { withTenantContext } from "@/lib/api-helpers";

export const PATCH = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const data = concessionSchema.partial().parse(await req.json());
    return ok(await prisma.concession.update({ where: { id }, data, include: { student: true } }));
  } catch (e) { return handleError(e); }
});

export const DELETE = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    await prisma.concession.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
});
