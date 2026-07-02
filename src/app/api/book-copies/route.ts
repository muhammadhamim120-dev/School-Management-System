import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError } from "@/lib/api";
import { bookCopySchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const bookId = req.nextUrl.searchParams.get("bookId")?.trim();
    const where = bookId ? { bookId } : {};
    const items = await prisma.bookCopy.findMany({ where, orderBy: { copyCode: "asc" }, include: { book: true } });
    return ok({ items, total: items.length, page: 1, limit: items.length, totalPages: 1 });
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const data = bookCopySchema.parse(await req.json());
    return created(await prisma.bookCopy.create({ data }));
  } catch (e) { return handleError(e); }
}
