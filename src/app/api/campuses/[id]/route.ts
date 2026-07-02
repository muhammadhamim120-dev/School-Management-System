import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { campusSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const campus = await prisma.campus.findUnique({
      where: { id },
      include: { _count: { select: { students: true, teachers: true, classes: true } } },
    });
    if (!campus) return handleError({ code: "P2025" });
    return ok(campus);
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    const data = campusSchema.partial().parse(await req.json());
    return ok(await prisma.campus.update({ where: { id }, data }));
  } catch (e) { return handleError(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    await prisma.campus.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
}
