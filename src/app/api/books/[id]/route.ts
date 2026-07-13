import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { bookSchema } from "@/lib/validations";
import { withTenantContext } from "@/lib/api-helpers";

export const GET = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: { category: true, author: true, publisher: true, copies: { orderBy: { copyCode: "asc" } } },
    });
    if (!book) return handleError({ code: "P2025" });
    return ok(book);
  } catch (e) { return handleError(e); }
});

export const PATCH = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const parsed = bookSchema.partial().parse(await req.json());
    const { copyCount: _c, ...data } = parsed;
    void _c;
    return ok(await prisma.book.update({ where: { id }, data, include: { category: true, author: true, publisher: true } }));
  } catch (e) { return handleError(e); }
});

export const DELETE = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    await prisma.book.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
});
