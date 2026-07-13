import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError, parsePagination } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/api-auth";

export const GET = async (req: NextRequest) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const action = req.nextUrl.searchParams.get("action") || undefined;
    const resource = req.nextUrl.searchParams.get("resource") || undefined;
    const schoolId = req.nextUrl.searchParams.get("schoolId") || undefined;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { resource: { contains: search, mode: "insensitive" } },
        { resourceId: { contains: search, mode: "insensitive" } },
      ];
    }
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (schoolId) where.schoolId = schoolId;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { organization: { select: { id: true, name: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    return handleError(e);
  }
};
