import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { classSchema } from "@/lib/validations";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const { search } = parsePagination(req.nextUrl.searchParams);
    const where = tenantWhere(search ? { name: { contains: search, mode: "insensitive" as const } } : {});
    const items = await prisma.class.findMany({
      where, orderBy: { name: "asc" },
      include: { sections: true, _count: { select: { students: true, subjects: true } } },
    });
    return ok({ items, total: items.length, page: 1, limit: items.length, totalPages: 1 });
  } catch (e) { return handleError(e); }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const data = classSchema.parse(await req.json());
    const schoolId = getRequiredTenantId();
    return created(await prisma.class.create({ data: { ...data, schoolId } }));
  } catch (e) { return handleError(e); }
});
