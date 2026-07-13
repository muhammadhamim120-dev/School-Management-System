import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { studentTransportSchema } from "@/lib/validations";
import { withTenantContext } from "@/lib/api-helpers";

export const PATCH = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const data = studentTransportSchema.partial().parse(await req.json());
    return ok(await prisma.studentTransport.update({ where: { id }, data, include: { student: true, route: true, stop: true } }));
  } catch (e) { return handleError(e); }
});

export const DELETE = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    await prisma.studentTransport.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
});
