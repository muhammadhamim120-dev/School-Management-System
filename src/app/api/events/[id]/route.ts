import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { eventSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await prisma.event.findUnique({ where: { id } });
    if (!item) return handleError({ code: "P2025" });
    return ok(item);
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    const data = eventSchema.partial().parse(await req.json());
    return ok(await prisma.event.update({ where: { id }, data }));
  } catch (e) { return handleError(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    await prisma.event.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
}
