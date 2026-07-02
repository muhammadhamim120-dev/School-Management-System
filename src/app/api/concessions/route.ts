import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { concessionSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
    const sp = req.nextUrl.searchParams;
    const type = sp.get("type")?.trim();
    const studentId = sp.get("studentId")?.trim();
    const AND: Record<string, unknown>[] = [];
    if (type) AND.push({ type });
    if (studentId) AND.push({ studentId });
    const where = AND.length ? { AND } : {};
    const [items, total] = await Promise.all([
      prisma.concession.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { student: true } }),
      prisma.concession.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const data = concessionSchema.parse(await req.json());
    return created(await prisma.concession.create({ data, include: { student: true } }));
  } catch (e) { return handleError(e); }
}
