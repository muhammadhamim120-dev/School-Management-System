import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { studentSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { studentId: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
