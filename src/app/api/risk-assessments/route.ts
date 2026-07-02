import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError, parsePagination } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const level = req.nextUrl.searchParams.get("level")?.trim();
    const AND: Record<string, unknown>[] = [];
    if (level) AND.push({ level });
    if (search) AND.push({ student: { fullName: { contains: search, mode: "insensitive" as const } } });
    const where = AND.length ? { AND } : {};
    const [items, total] = await Promise.all([
      prisma.riskAssessment.findMany({ where, skip, take: limit, orderBy: [{ score: "desc" }, { computedAt: "desc" }],
        include: { student: { include: { class: true } } } }),
      prisma.riskAssessment.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
}
