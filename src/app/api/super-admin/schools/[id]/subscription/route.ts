import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/api-auth";

export const GET = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const { id } = await params;
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: id },
    });

    if (!subscription) return handleError({ code: "P2025" });
    return ok(subscription);
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
    const { tier, status, maxStudents, maxTeachers, maxStorageMb, monthlyPrice, billingEmail } = body;

    const subscription = await prisma.subscription.update({
      where: { organizationId: id },
      data: {
        ...(tier !== undefined && { tier }),
        ...(status !== undefined && { status }),
        ...(maxStudents !== undefined && { maxStudents }),
        ...(maxTeachers !== undefined && { maxTeachers }),
        ...(maxStorageMb !== undefined && { maxStorageMb }),
        ...(monthlyPrice !== undefined && { monthlyPrice }),
        ...(billingEmail !== undefined && { billingEmail }),
      },
    });

    return ok(subscription);
  } catch (e) {
    return handleError(e);
  }
};
