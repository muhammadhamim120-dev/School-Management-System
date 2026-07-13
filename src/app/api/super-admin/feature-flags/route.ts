import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/api-auth";

export const GET = async (req: NextRequest) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const flags = await prisma.featureFlag.findMany({ orderBy: { createdAt: "desc" } });
    return ok(flags);
  } catch (e) {
    return handleError(e);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const body = await req.json();
    const { key, description, defaultValue } = body;

    if (!key) return handleError({ code: "P2025", message: "Key is required" });

    const flag = await prisma.featureFlag.create({
      data: { key, description, defaultValue: defaultValue ?? false },
    });

    return created(flag);
  } catch (e) {
    return handleError(e);
  }
};
