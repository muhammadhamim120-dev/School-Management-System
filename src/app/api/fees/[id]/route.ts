import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { feeSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    const data = feeSchema.partial().parse(await req.json());
    return ok(await prisma.fee.update({ where: { id }, data, include: { student: true } }));
  } catch (e) { return handleError(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    await prisma.fee.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
}
