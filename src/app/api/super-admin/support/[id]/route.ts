import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/api-auth";

export const GET = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const { id } = await params;
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: { organization: { select: { id: true, name: true } } },
    });

    if (!ticket) return handleError({ code: "P2025" });
    return ok(ticket);
  } catch (e) {
    return handleError(e);
  }
};

export const PATCH = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const { id } = await params;
    const body = await req.json();
    const { status, priority, description } = body;

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(description !== undefined && { description }),
      },
      include: { organization: { select: { id: true, name: true } } },
    });

    return ok(ticket);
  } catch (e) {
    return handleError(e);
  }
};

export const DELETE = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const { id } = await params;
    await prisma.supportTicket.delete({ where: { id } });
    return ok({ id });
  } catch (e) {
    return handleError(e);
  }
};
