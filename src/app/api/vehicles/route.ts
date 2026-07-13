import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { vehicleSchema } from "@/lib/validations";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const status = req.nextUrl.searchParams.get("status")?.trim();
    const AND: Record<string, unknown>[] = [];
    if (search) AND.push({ regNumber: { contains: search, mode: "insensitive" as const } });
    if (status) AND.push({ status });
    const where = tenantWhere(AND.length ? { AND } : {});
    const [items, total] = await Promise.all([
      prisma.vehicle.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { driver: true } }),
      prisma.vehicle.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const data = vehicleSchema.parse(await req.json());
    return created(await prisma.vehicle.create({ data: { ...data, driverId: data.driverId || null, schoolId: getRequiredTenantId() }, include: { driver: true } }));
  } catch (e) { return handleError(e); }
});
