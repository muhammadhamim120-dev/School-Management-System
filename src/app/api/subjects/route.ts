import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { subjectSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const where = search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { code: { contains: search, mode: "insensitive" as const } }] } : {};
    const [items, total] = await Promise.all([
      prisma.subject.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { class: true, teacher: true } }),
      prisma.subject.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const data = subjectSchema.parse(await req.json());
    return created(await prisma.subject.create({ data, include: { class: true, teacher: true } }));
  } catch (e) { return handleError(e); }
}
