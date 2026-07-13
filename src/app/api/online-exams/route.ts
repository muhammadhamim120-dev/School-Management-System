import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { onlineExamSchema } from "@/lib/validations";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

// GET — list online exams (with status filter).
export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const status = req.nextUrl.searchParams.get("status") || undefined;
    const classId = req.nextUrl.searchParams.get("classId") || undefined;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (classId) where.classId = classId;
    if (search) where.title = { contains: search, mode: "insensitive" as const };
    const [items, total] = await Promise.all([
      prisma.onlineExam.findMany({
        where: tenantWhere(where), skip, take: limit, orderBy: { startTime: "desc" },
        include: { class: true, section: true, subject: true, teacher: true, _count: { select: { questions: true, attempts: true } } },
      }),
      prisma.onlineExam.count({ where: tenantWhere(where) }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
});

// POST — create an online exam (starts in DRAFT unless a status is supplied).
export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const data = onlineExamSchema.parse(await req.json());
    return created(await prisma.onlineExam.create({
      data: { ...data, schoolId: getRequiredTenantId() },
      include: { class: true, section: true, subject: true, teacher: true },
    }));
  } catch (e) { return handleError(e); }
});
