import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { teacherSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const sp = req.nextUrl.searchParams;

    const status = sp.get("status")?.trim();
    const department = sp.get("department")?.trim();

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
    const where = AND.length ? { AND } : {};

    const [items, total] = await Promise.all([
      prisma.teacher.findMany({ where, skip, take: limit, orderBy }),
      prisma.teacher.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return handleError({ code: "P2025" });
    const data = teacherSchema.parse(await req.json());
    const teacher = await prisma.teacher.create({ data });
    return created(teacher);
  } catch (e) {
    return handleError(e);
  }
}
