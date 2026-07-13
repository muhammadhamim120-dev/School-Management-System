import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { subjectSchema } from "@/lib/validations";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const where = tenantWhere(search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { code: { contains: search, mode: "insensitive" as const } }] } : {});
    const [items, total] = await Promise.all([
      prisma.subject.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { class: true, teacher: true } }),
      prisma.subject.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const data = subjectSchema.parse(await req.json());
    const schoolId = getRequiredTenantId();
    return created(await prisma.subject.create({ data: { ...data, schoolId }, include: { class: true, teacher: true } }));
  } catch (e) { return handleError(e); }
});
