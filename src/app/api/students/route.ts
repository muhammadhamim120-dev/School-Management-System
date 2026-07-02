import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { studentSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
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
    const where = AND.length ? { AND } : {};

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
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return handleError({ code: "P2025" });
    const body = await req.json();
    const data = studentSchema.parse(body);
    const student = await prisma.student.create({ data });
    return created(student);
  } catch (e) {
    return handleError(e);
  }
}
