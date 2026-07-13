import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { campusSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/api-auth";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const auth = await requireAdmin();
    if (!auth.authenticated) return auth.error;

    const { search } = parsePagination(req.nextUrl.searchParams);
    const where = tenantWhere(
      search
        ? { OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
          ] }
        : {}
    );
    const items = await prisma.campus.findMany({
      where, orderBy: [{ isMain: "desc" }, { name: "asc" }],
      include: { _count: { select: { students: true, teachers: true, classes: true } } },
    });
    return ok({ items, total: items.length, page: 1, limit: items.length, totalPages: 1 });
  } catch (e) { return handleError(e); }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const auth = await requireAdmin();
    if (!auth.authenticated) return auth.error;

    const data = campusSchema.parse(await req.json());
    const schoolId = getRequiredTenantId();
    return created(await prisma.campus.create({ data: { ...data, schoolId } }));
  } catch (e) { return handleError(e); }
});
