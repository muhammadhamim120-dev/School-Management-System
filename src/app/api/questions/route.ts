import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { questionSchema } from "@/lib/validations";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

// GET -- list question bank with optional type/subject/class filters.
export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const type = req.nextUrl.searchParams.get("type") || undefined;
    const subjectId = req.nextUrl.searchParams.get("subjectId") || undefined;
    const classId = req.nextUrl.searchParams.get("classId") || undefined;
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (subjectId) where.subjectId = subjectId;
    if (classId) where.classId = classId;
    if (search) where.text = { contains: search, mode: "insensitive" as const };
    const [items, total] = await Promise.all([
      prisma.question.findMany({
        where: tenantWhere(where), skip, take: limit, orderBy: { createdAt: "desc" },
        include: { subject: true, teacher: true, class: true },
      }),
      prisma.question.count({ where: tenantWhere(where) }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
});

// POST -- create a question. options come as a string array (MCQ).
export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const data = questionSchema.parse(await req.json());
    const schoolId = getRequiredTenantId();
    return created(await prisma.question.create({
      data: { ...data, options: data.options && data.options.length ? data.options : undefined, schoolId },
      include: { subject: true, teacher: true, class: true },
    }));
  } catch (e) { return handleError(e); }
});
