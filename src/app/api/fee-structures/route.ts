import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { feeStructureSchema } from "@/lib/validations";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const { search } = parsePagination(req.nextUrl.searchParams);
    const categoryId = req.nextUrl.searchParams.get("categoryId")?.trim();
    const AND: Record<string, unknown>[] = [];
    if (search) AND.push({ label: { contains: search, mode: "insensitive" as const } });
    if (categoryId) AND.push({ categoryId });
    const items = await prisma.feeStructure.findMany({ where: tenantWhere(AND.length ? { AND } : {}), orderBy: { createdAt: "desc" }, include: { category: true } });
    return ok({ items, total: items.length, page: 1, limit: items.length, totalPages: 1 });
  } catch (e) { return handleError(e); }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const data = feeStructureSchema.parse(await req.json());
    return created(await prisma.feeStructure.create({ data: { ...data, schoolId: getRequiredTenantId() }, include: { category: true } }));
  } catch (e) { return handleError(e); }
});
