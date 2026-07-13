import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/api-auth";

export const PATCH = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const { id } = await params;
    const body = await req.json();
    const { defaultValue, description } = body;

    const flag = await prisma.featureFlag.update({
      where: { id },
      data: {
        ...(defaultValue !== undefined && { defaultValue }),
        ...(description !== undefined && { description }),
      },
    });

    return ok(flag);
  } catch (e) {
    return handleError(e);
  }
};

export const DELETE = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const { id } = await params;
    await prisma.featureFlag.delete({ where: { id } });
    return ok({ id });
  } catch (e) {
    return handleError(e);
  }
};
