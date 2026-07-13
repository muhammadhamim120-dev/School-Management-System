import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { questionSchema } from "@/lib/validations";
import { withTenantContext } from "@/lib/api-helpers";

export const GET = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const item = await prisma.question.findUnique({
      where: { id },
      include: { subject: true, teacher: true, class: true },
    });
    if (!item) return handleError({ code: "P2025" });
    return ok(item);
  } catch (e) { return handleError(e); }
});

export const PATCH = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const data = questionSchema.partial().parse(await req.json());
    return ok(await prisma.question.update({
      where: { id },
      data: { ...data, options: data.options && data.options.length ? data.options : undefined },
      include: { subject: true, teacher: true, class: true },
    }));
  } catch (e) { return handleError(e); }
});

export const DELETE = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    await prisma.question.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
});
