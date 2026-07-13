import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { studentSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/api-auth";
import { validateCsrf } from "@/lib/csrf";
import { deleteCached, cacheKeys } from "@/lib/cache";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    // Require authentication
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.error;

    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const sp = req.nextUrl.searchParams;

    // Optional, backward-compatible filters. When absent, behavior is unchanged.
    const status = sp.get("status")?.trim();
    const classId = sp.get("classId")?.trim();
    const sectionId = sp.get("sectionId")?.trim();

    // Optional sort. Defaults preserve the original `createdAt desc` behavior.
    const sortableFields = ["createdAt", "fullName", "studentId", "rollNumber", "admissionDate"];
    const sortField = sp.get("sortField")?.trim() ?? "createdAt";
    const sortDir = sp.get("sortDir")?.trim() === "asc" ? "asc" : "desc";
    const orderBy = sortableFields.includes(sortField)
      ? { [sortField]: sortDir as "asc" | "desc" }
      : { createdAt: "desc" as const };

    const AND: Record<string, unknown>[] = [];
    if (search) {
      AND.push({
        OR: [
          { fullName: { contains: search, mode: "insensitive" as const } },
          { studentId: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }
    if (status) AND.push({ status });
    if (classId) AND.push({ classId });
    if (sectionId) AND.push({ sectionId });
    const where = tenantWhere(AND.length ? { AND } : {});

    const [items, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { class: true, section: true, parent: true },
      }),
      prisma.student.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    return handleError(e);
  }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    // CSRF protection
    const csrfError = validateCsrf(req);
    if (csrfError) return csrfError;

    // Require authentication
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.error;

    const body = await req.json();
    const data = studentSchema.parse(body);
    const schoolId = getRequiredTenantId();
    const student = await prisma.student.create({ data: { ...data, schoolId } });

    // Invalidate dashboard cache when students change
    deleteCached(cacheKeys.dashboard());

    return created(student);
  } catch (e) {
    return handleError(e);
  }
});
