import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError, parsePagination } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/api-auth";

export const GET = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const { id } = await params;
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const where = { schoolId: id, ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}) };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, role: true, image: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);

    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    return handleError(e);
  }
};
