import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { bookSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: { category: true, author: true, publisher: true, copies: { orderBy: { copyCode: "asc" } } },
    });
    if (!book) return handleError({ code: "P2025" });
    return ok(book);
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    const parsed = bookSchema.partial().parse(await req.json());
    const { copyCount: _c, ...data } = parsed;
    void _c;
    return ok(await prisma.book.update({ where: { id }, data, include: { category: true, author: true, publisher: true } }));
  } catch (e) { return handleError(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    await prisma.book.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
}
