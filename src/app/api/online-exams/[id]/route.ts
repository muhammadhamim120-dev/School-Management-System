import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { onlineExamSchema } from "@/lib/validations";
import { withTenantContext } from "@/lib/api-helpers";

export const GET = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const item = await prisma.onlineExam.findUnique({
      where: { id },
      include: {
        class: true, section: true, subject: true, teacher: true,
        questions: { include: { question: true }, orderBy: { order: "asc" } },
      },
    });
    if (!item) return handleError({ code: "P2025" });
    return ok(item);
  } catch (e) { return handleError(e); }
});

export const PATCH = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const data = onlineExamSchema.partial().parse(await req.json());
    return ok(await prisma.onlineExam.update({
      where: { id }, data,
      include: { class: true, subject: true, teacher: true },
    }));
  } catch (e) { return handleError(e); }
});

export const DELETE = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    await prisma.onlineExam.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
});
