import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { bookSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const sp = req.nextUrl.searchParams;
    const categoryId = sp.get("categoryId")?.trim();
    const authorId = sp.get("authorId")?.trim();
    const language = sp.get("language")?.trim();
    const sortableFields = ["createdAt", "title", "publishYear"];
    const sortField = sp.get("sortField")?.trim() ?? "createdAt";
    const sortDir = sp.get("sortDir")?.trim() === "asc" ? "asc" : "desc";
    const orderBy = sortableFields.includes(sortField) ? { [sortField]: sortDir as "asc" | "desc" } : { createdAt: "desc" as const };

    const AND: Record<string, unknown>[] = [];
    if (search) AND.push({ OR: [
      { title: { contains: search, mode: "insensitive" as const } },
      { isbn: { contains: search, mode: "insensitive" as const } },
    ] });
    if (categoryId) AND.push({ categoryId });
    if (authorId) AND.push({ authorId });
    if (language) AND.push({ language });
    const where = AND.length ? { AND } : {};

    const [items, total] = await Promise.all([
      prisma.book.findMany({ where, skip, take: limit, orderBy,
        include: { category: true, author: true, publisher: true, _count: { select: { copies: true } } } }),
      prisma.book.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { copyCount, ...data } = bookSchema.parse(await req.json());

    const book = await prisma.book.create({ data: {
      title: data.title, isbn: data.isbn || null, categoryId: data.categoryId || null,
      authorId: data.authorId || null, publisherId: data.publisherId || null,
      edition: data.edition || null, publishYear: data.publishYear ?? null, language: data.language || null,
      shelf: data.shelf || null, rack: data.rack || null, description: data.description || null, coverUrl: data.coverUrl || null,
    }});

    // Auto-generate physical copies with sequential codes.
    const n = copyCount ?? 1;
    if (n > 0) {
      const prefix = `BK-${book.id.slice(-4).toUpperCase()}`;
      await prisma.bookCopy.createMany({
        data: Array.from({ length: n }).map((_, i) => ({ bookId: book.id, copyCode: `${prefix}-${String(i + 1).padStart(2, "0")}` })),
      });
    }
    const full = await prisma.book.findUnique({ where: { id: book.id }, include: { category: true, author: true, publisher: true, _count: { select: { copies: true } } } });
    return created(full);
  } catch (e) { return handleError(e); }
}
