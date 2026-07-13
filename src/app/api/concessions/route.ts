import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { concessionSchema } from "@/lib/validations";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
    const sp = req.nextUrl.searchParams;
    const type = sp.get("type")?.trim();
    const studentId = sp.get("studentId")?.trim();
    const AND: Record<string, unknown>[] = [];
    if (type) AND.push({ type });
    if (studentId) AND.push({ studentId });
    const [items, total] = await Promise.all([
      prisma.concession.findMany({ where: tenantWhere(AND.length ? { AND } : {}), skip, take: limit, orderBy: { createdAt: "desc" }, include: { student: true } }),
      prisma.concession.count({ where: tenantWhere(AND.length ? { AND } : {}) }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const data = concessionSchema.parse(await req.json());
    return created(await prisma.concession.create({ data: { ...data, schoolId: getRequiredTenantId() }, include: { student: true } }));
  } catch (e) { return handleError(e); }
});
