import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { feeSchema } from "@/lib/validations";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const where = search ? { title: { contains: search, mode: "insensitive" as const } } : {};
    const [items, total] = await Promise.all([
      prisma.fee.findMany({ where: tenantWhere(where), skip, take: limit, orderBy: { createdAt: "desc" }, include: { student: true } }),
      prisma.fee.count({ where: tenantWhere(where) }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const data = feeSchema.parse(await req.json());
    let status = data.status;
    if (data.paidAmount >= data.amount && data.amount > 0) status = "PAID";
    else if (data.paidAmount > 0) status = "PARTIAL";
    return created(await prisma.fee.create({ data: { ...data, status, schoolId: getRequiredTenantId() }, include: { student: true } }));
  } catch (e) { return handleError(e); }
});
