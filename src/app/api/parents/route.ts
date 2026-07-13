import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { parentSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/api-auth";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    // Require authentication
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.error;

    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const sp = req.nextUrl.searchParams;

    const sortableFields = ["createdAt", "fullName", "parentId"];
    const sortField = sp.get("sortField")?.trim() ?? "createdAt";
    const sortDir = sp.get("sortDir")?.trim() === "asc" ? "asc" : "desc";
    const orderBy = sortableFields.includes(sortField)
      ? { [sortField]: sortDir as "asc" | "desc" }
      : { createdAt: "desc" as const };

    const where = tenantWhere(
      search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" as const } },
              { parentId: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              { occupation: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}
    );
    const [items, total] = await Promise.all([
      prisma.parent.findMany({ where, skip, take: limit, orderBy, include: { students: true } }),
      prisma.parent.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    return handleError(e);
  }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    // Require authentication
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.error;

    const { studentIds, ...data } = parentSchema.parse(await req.json());
    const schoolId = getRequiredTenantId();
    const parent = await prisma.parent.create({
      data: { ...data, schoolId, students: studentIds?.length ? { connect: studentIds.map((id) => ({ id })) } : undefined },
      include: { students: true },
    });
    return created(parent);
  } catch (e) {
    return handleError(e);
  }
});
