import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { feeStructureSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { search } = parsePagination(req.nextUrl.searchParams);
    const categoryId = req.nextUrl.searchParams.get("categoryId")?.trim();
    const AND: Record<string, unknown>[] = [];
    if (search) AND.push({ label: { contains: search, mode: "insensitive" as const } });
    if (categoryId) AND.push({ categoryId });
    const where = AND.length ? { AND } : {};
    const items = await prisma.feeStructure.findMany({ where, orderBy: { createdAt: "desc" }, include: { category: true } });
    return ok({ items, total: items.length, page: 1, limit: items.length, totalPages: 1 });
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const data = feeStructureSchema.parse(await req.json());
    return created(await prisma.feeStructure.create({ data, include: { category: true } }));
  } catch (e) { return handleError(e); }
}
