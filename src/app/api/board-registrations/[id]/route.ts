import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { boardRegistrationSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await prisma.boardRegistration.findUnique({ where: { id }, include: { student: true } });
    if (!item) return handleError({ code: "P2025" });
    return ok(item);
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authSession = await auth(); if (!authSession) return handleError({ code: "P2025" });
    const { id } = await params;
    const data = boardRegistrationSchema.partial().parse(await req.json());
    return ok(await prisma.boardRegistration.update({ where: { id }, data, include: { student: true } }));
  } catch (e) { return handleError(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authSession = await auth(); if (!authSession) return handleError({ code: "P2025" });
    const { id } = await params;
    await prisma.boardRegistration.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
}
