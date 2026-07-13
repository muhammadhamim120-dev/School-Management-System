import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { withTenantContext } from "@/lib/api-helpers";

export const GET = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const campus = await prisma.campus.findUnique({
      where: { id },
      include: { _count: { select: { students: true, teachers: true, classes: true } } },
    });
    if (!campus) return handleError({ code: "P2025" });
    return ok(campus);
  } catch (e) { return handleError(e); }
});

export const PATCH = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const { campusSchema } = await import("@/lib/validations");
    const data = campusSchema.partial().parse(await req.json());
    return ok(await prisma.campus.update({ where: { id }, data }));
  } catch (e) { return handleError(e); }
});

export const DELETE = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    await prisma.campus.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
});
