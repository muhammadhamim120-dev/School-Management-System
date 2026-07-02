import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const msg = await prisma.smsMessage.findUnique({ where: { id }, include: { template: true, recipients: { orderBy: { createdAt: "asc" } } } });
    if (!msg) return handleError({ code: "P2025" });
    return ok(msg);
  } catch (e) { return handleError(e); }
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    await prisma.smsMessage.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
}
