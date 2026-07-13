import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { homeworkSchema } from "@/lib/validations";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";
import { notifyParentsHomework } from "@/lib/homework";

// GET — list homework with optional class/section/subject filters.
export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const classId = req.nextUrl.searchParams.get("classId") || undefined;
    const sectionId = req.nextUrl.searchParams.get("sectionId") || undefined;
    const subjectId = req.nextUrl.searchParams.get("subjectId") || undefined;
    const where: Record<string, unknown> = {};
    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;
    // A section filter of "ALL" / empty selects homework scoped to the whole
    // class (sectionId null) plus the chosen section.
    if (sectionId && sectionId !== "ALL") {
      where.OR = [{ sectionId: null }, { sectionId }];
    }
    if (search) where.title = { contains: search, mode: "insensitive" as const };
    const [items, total] = await Promise.all([
      prisma.homework.findMany({
        where: tenantWhere(where), skip, take: limit, orderBy: { dueDate: "desc" },
        include: { class: true, section: true, subject: true, teacher: true, _count: { select: { submissions: true } } },
      }),
      prisma.homework.count({ where: tenantWhere(where) }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
});

// POST — create a homework assignment. notifyParents=true fires an SMS to the
// parents of the targeted class/section (best-effort, never blocks creation).
export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const input = homeworkSchema.parse(await req.json());
    const { notifyParents, ...data } = input;
    const hw = await prisma.homework.create({
      data: { ...data, schoolId: getRequiredTenantId() },
      include: { class: true, section: true, subject: true, teacher: true },
    });
    if (notifyParents) {
      try { await notifyParentsHomework(hw.id); } catch { /* best-effort */ }
    }
    return created(hw);
  } catch (e) { return handleError(e); }
});
