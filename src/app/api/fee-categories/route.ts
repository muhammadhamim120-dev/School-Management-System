import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { feeCategorySchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { search } = parsePagination(req.nextUrl.searchParams);
    const type = req.nextUrl.searchParams.get("type")?.trim();
    const AND: Record<string, unknown>[] = [];
    if (search) AND.push({ name: { contains: search, mode: "insensitive" as const } });
    if (type) AND.push({ type });
    const where = AND.length ? { AND } : {};
    const items = await prisma.feeCategory.findMany({ where, orderBy: { name: "asc" } });
    return ok({ items, total: items.length, page: 1, limit: items.length, totalPages: 1 });
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const data = feeCategorySchema.parse(await req.json());
    return created(await prisma.feeCategory.create({ data }));
  } catch (e) { return handleError(e); }
}
