import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { homeworkSchema } from "@/lib/validations";
import { withTenantContext } from "@/lib/api-helpers";

export const GET = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const item = await prisma.homework.findUnique({
      where: { id },
      include: { class: true, section: true, subject: true, teacher: true },
    });
    if (!item) return handleError({ code: "P2025" });
    return ok(item);
  } catch (e) { return handleError(e); }
});

export const PATCH = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const { notifyParents, ...data } = homeworkSchema.partial().parse(await req.json());
    return ok(await prisma.homework.update({ where: { id }, data, include: { class: true, subject: true, teacher: true } }));
  } catch (e) { return handleError(e); }
});

export const DELETE = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    await prisma.homework.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
});
