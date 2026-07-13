import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { teacherSchema } from "@/lib/validations";
import { withTenantContext } from "@/lib/api-helpers";

export const GET = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const teacher = await prisma.teacher.findUnique({ where: { id }, include: { subjects: true } });
    if (!teacher) return handleError({ code: "P2025" });
    return ok(teacher);
  } catch (e) {
    return handleError(e);
  }
});

export const PATCH = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const data = teacherSchema.partial().parse(await req.json());
    const teacher = await prisma.teacher.update({ where: { id }, data });
    return ok(teacher);
  } catch (e) {
    return handleError(e);
  }
});

export const DELETE = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    await prisma.teacher.delete({ where: { id } });
    return ok({ id });
  } catch (e) {
    return handleError(e);
  }
});
