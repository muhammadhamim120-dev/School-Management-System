import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { teacherSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/api-auth";
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

    const status = sp.get("status")?.trim();
    const department = sp.get("department")?.trim();
    const shift = sp.get("shift")?.trim();

    const sortableFields = ["createdAt", "fullName", "teacherId", "experience", "joiningDate"];
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
          { teacherId: { contains: search, mode: "insensitive" as const } },
          { department: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }
    if (status) AND.push({ status });
    if (department) AND.push({ department });
    if (shift) AND.push({ shift: shift as "MORNING" | "DAY" | "EVENING" });
    const where = tenantWhere(AND.length ? { AND } : {});

    const [items, total] = await Promise.all([
      prisma.teacher.findMany({ where, skip, take: limit, orderBy }),
      prisma.teacher.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    return handleError(e);
  }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    // Require authentication
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.error;

    const data = teacherSchema.parse(await req.json());
    const schoolId = getRequiredTenantId();
    const teacher = await prisma.teacher.create({ data: { ...data, schoolId } });

    // Invalidate dashboard cache when teachers change
    deleteCached(cacheKeys.dashboard());

    return created(teacher);
  } catch (e) {
    return handleError(e);
  }
});
