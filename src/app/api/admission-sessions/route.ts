import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { admissionSessionSchema } from "@/lib/validations";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const { search } = parsePagination(req.nextUrl.searchParams);
    const where = tenantWhere(search ? { name: { contains: search, mode: "insensitive" as const } } : {});
    const items = await prisma.admissionSession.findMany({ where, orderBy: { year: "desc" }, include: { _count: { select: { applications: true } } } });
    return ok({ items, total: items.length, page: 1, limit: items.length, totalPages: 1 });
  } catch (e) { return handleError(e); }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const data = admissionSessionSchema.parse(await req.json());
    return created(await prisma.admissionSession.create({ data: {
      name: data.name, year: data.year, classApplied: data.classApplied || null,
      startDate: data.startDate ?? null, endDate: data.endDate ?? null, seats: data.seats, isOpen: data.isOpen,
      schoolId: getRequiredTenantId(),
    } }));
  } catch (e) { return handleError(e); }
});
