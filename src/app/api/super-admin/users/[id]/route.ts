import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/api-auth";

export const GET = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        schoolId: true,
        createdAt: true,
        updatedAt: true,
        organization: { select: { id: true, name: true } },
      },
    });

    if (!user) return handleError({ code: "P2025" });
    return ok(user);
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
    const { name, email, role, schoolId } = body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(role !== undefined && { role }),
        ...(schoolId !== undefined && { schoolId }),
      },
      select: { id: true, name: true, email: true, role: true, schoolId: true },
    });

    return ok(user);
  } catch (e) {
    return handleError(e);
  }
};

export const DELETE = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const { id } = await params;
    await prisma.user.delete({ where: { id } });
    return ok({ id });
  } catch (e) {
    return handleError(e);
  }
};
