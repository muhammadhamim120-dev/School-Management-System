import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { feeCategorySchema } from "@/lib/validations";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const { search } = parsePagination(req.nextUrl.searchParams);
    const type = req.nextUrl.searchParams.get("type")?.trim();
    const AND: Record<string, unknown>[] = [];
    if (search) AND.push({ name: { contains: search, mode: "insensitive" as const } });
    if (type) AND.push({ type });
    const items = await prisma.feeCategory.findMany({ where: tenantWhere(AND.length ? { AND } : {}), orderBy: { name: "asc" } });
    return ok({ items, total: items.length, page: 1, limit: items.length, totalPages: 1 });
  } catch (e) { return handleError(e); }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const data = feeCategorySchema.parse(await req.json());
    return created(await prisma.feeCategory.create({ data: { ...data, schoolId: getRequiredTenantId() } }));
  } catch (e) { return handleError(e); }
});
