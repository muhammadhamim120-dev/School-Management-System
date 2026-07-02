import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { sessionSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { search } = parsePagination(req.nextUrl.searchParams);
    const where = search ? { name: { contains: search, mode: "insensitive" as const } } : {};
    const items = await prisma.academicSession.findMany({
      where, orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
      include: { terms: { orderBy: { startDate: "asc" } } },
    });
    return ok({ items, total: items.length, page: 1, limit: items.length, totalPages: 1 });
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const authSession = await auth();
    if (!authSession) return handleError({ code: "P2025" });
    const data = sessionSchema.parse(await req.json());
    return created(await prisma.academicSession.create({ data }));
  } catch (e) { return handleError(e); }
}
