import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { z } from "zod";

const patchSchema = z.object({ status: z.enum(["AVAILABLE","ISSUED","LOST","DAMAGED","RESERVED"]).optional(), copyCode: z.string().optional() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    const data = patchSchema.parse(await req.json());
    return ok(await prisma.bookCopy.update({ where: { id }, data }));
  } catch (e) { return handleError(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    await prisma.bookCopy.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
}
