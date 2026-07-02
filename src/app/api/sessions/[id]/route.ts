import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { sessionSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await prisma.academicSession.findUnique({
      where: { id },
      include: { terms: { orderBy: { startDate: "asc" } } },
    });
    if (!item) return handleError({ code: "P2025" });
    return ok(item);
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authSession = await auth(); if (!authSession) return handleError({ code: "P2025" });
    const { id } = await params;
    const data = sessionSchema.partial().parse(await req.json());
    return ok(await prisma.academicSession.update({ where: { id }, data }));
  } catch (e) { return handleError(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authSession = await auth(); if (!authSession) return handleError({ code: "P2025" });
    const { id } = await params;
    await prisma.academicSession.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
}
