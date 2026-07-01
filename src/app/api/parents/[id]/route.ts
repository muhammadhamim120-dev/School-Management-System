import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { parentSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parent = await prisma.parent.findUnique({ where: { id }, include: { students: true } });
    if (!parent) return handleError({ code: "P2025" });
    return ok(parent);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    const { studentIds, ...data } = parentSchema.partial().parse(await req.json());
    const parent = await prisma.parent.update({
      where: { id },
      data: { ...data, students: studentIds ? { set: studentIds.map((sid) => ({ id: sid })) } : undefined },
      include: { students: true },
    });
    return ok(parent);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    await prisma.parent.delete({ where: { id } });
    return ok({ id });
  } catch (e) {
    return handleError(e);
  }
}
