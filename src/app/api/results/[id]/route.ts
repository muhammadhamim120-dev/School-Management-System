import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    await prisma.result.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
}
