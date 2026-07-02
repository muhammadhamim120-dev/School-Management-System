import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { admissionSessionSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { search } = parsePagination(req.nextUrl.searchParams);
    const where = search ? { name: { contains: search, mode: "insensitive" as const } } : {};
    const items = await prisma.admissionSession.findMany({ where, orderBy: { year: "desc" }, include: { _count: { select: { applications: true } } } });
    return ok({ items, total: items.length, page: 1, limit: items.length, totalPages: 1 });
  } catch (e) { return handleError(e); }
}
export async function POST(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const data = admissionSessionSchema.parse(await req.json());
    return created(await prisma.admissionSession.create({ data: {
      name: data.name, year: data.year, classApplied: data.classApplied || null,
      startDate: data.startDate ?? null, endDate: data.endDate ?? null, seats: data.seats, isOpen: data.isOpen,
    } }));
  } catch (e) { return handleError(e); }
}
