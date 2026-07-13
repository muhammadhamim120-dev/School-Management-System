import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { studentTransportSchema } from "@/lib/validations";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
    const sp = req.nextUrl.searchParams;
    const routeId = sp.get("routeId")?.trim();
    const studentId = sp.get("studentId")?.trim();
    const AND: Record<string, unknown>[] = [];
    if (routeId) AND.push({ routeId });
    if (studentId) AND.push({ studentId });
    const where = AND.length ? { AND } : {};
    const [items, total] = await Promise.all([
      prisma.studentTransport.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" },
        include: { student: true, route: true, stop: true } }),
      prisma.studentTransport.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const data = studentTransportSchema.parse(await req.json());
    return created(await prisma.studentTransport.create({ data: { ...data, stopId: data.stopId || null }, include: { student: true, route: true, stop: true } }));
  } catch (e) { return handleError(e); }
});
