import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { classSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { search } = parsePagination(req.nextUrl.searchParams);
    const where = search ? { name: { contains: search, mode: "insensitive" as const } } : {};
    const items = await prisma.class.findMany({
      where, orderBy: { name: "asc" },
      include: { sections: true, _count: { select: { students: true, subjects: true } } },
    });
    return ok({ items, total: items.length, page: 1, limit: items.length, totalPages: 1 });
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return handleError({ code: "P2025" });
    const data = classSchema.parse(await req.json());
    return created(await prisma.class.create({ data }));
  } catch (e) { return handleError(e); }
}
