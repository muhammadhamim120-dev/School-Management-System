import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { eventSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const where = search ? { OR: [{ title: { contains: search, mode: "insensitive" as const } }, { location: { contains: search, mode: "insensitive" as const } }] } : {};
    const [items, total] = await Promise.all([
      prisma.event.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.event.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const data = eventSchema.parse(await req.json());
    return created(await prisma.event.create({ data }));
  } catch (e) { return handleError(e); }
}
