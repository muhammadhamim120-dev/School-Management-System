import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/api-auth";

export const GET = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const { id } = await params;
    const school = await prisma.organization.findUnique({
      where: { id },
      include: {
        subscription: true,
        _count: { select: { users: true } },
      },
    });

    if (!school) return handleError({ code: "P2025" });
    return ok(school);
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
    const { name, email, phone, address, status, timezone, currency, locale } = body;

    const school = await prisma.organization.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(status !== undefined && { status }),
        ...(timezone !== undefined && { timezone }),
        ...(currency !== undefined && { currency }),
        ...(locale !== undefined && { locale }),
      },
      include: { subscription: true },
    });

    return ok(school);
  } catch (e) {
    return handleError(e);
  }
};

export const DELETE = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const { id } = await params;
    const school = await prisma.organization.update({
      where: { id },
      data: { status: "SUSPENDED" },
    });

    return ok(school);
  } catch (e) {
    return handleError(e);
  }
};
