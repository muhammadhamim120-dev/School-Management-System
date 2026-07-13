import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { coachingBatchSchema } from "@/lib/validations";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

// GET — list batches with subject/teacher + enrollment count.
export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const status = req.nextUrl.searchParams.get("status")?.trim();
    const where: Record<string, unknown> = {};
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      prisma.coachingBatch.findMany({
        where: tenantWhere(where), skip, take: limit,
        include: { subject: true, teacher: true, _count: { select: { enrollments: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.coachingBatch.count({ where: tenantWhere(where) }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 });
  } catch (e) { return handleError(e); }
});

// POST — create a batch.
export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const data = coachingBatchSchema.parse(await req.json());
    const batch = await prisma.coachingBatch.create({ data: { ...data, schoolId: getRequiredTenantId() }, include: { subject: true, teacher: true } });
    return created(batch);
  } catch (e) { return handleError(e); }
});
