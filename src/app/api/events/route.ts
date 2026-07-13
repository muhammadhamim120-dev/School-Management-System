import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { eventSchema } from "@/lib/validations";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const where = tenantWhere(search ? { OR: [{ title: { contains: search, mode: "insensitive" as const } }, { location: { contains: search, mode: "insensitive" as const } }] } : {});
    const [items, total] = await Promise.all([
      prisma.event.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.event.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const data = eventSchema.parse(await req.json());
    const schoolId = getRequiredTenantId();
    return created(await prisma.event.create({ data: { ...data, schoolId } }));
  } catch (e) { return handleError(e); }
});
