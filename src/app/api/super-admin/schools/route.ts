import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError, parsePagination } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/api-auth";

export const GET = async (req: NextRequest) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const where = search
      ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }] }
      : {};

    const [items, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          subscription: { select: { tier: true, status: true, monthlyPrice: true } },
          _count: { select: { users: true } },
        },
      }),
      prisma.organization.count({ where }),
    ]);

    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    return handleError(e);
  }
};
