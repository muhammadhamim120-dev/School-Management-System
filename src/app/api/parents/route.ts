import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { parentSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { parentId: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { occupation: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      prisma.parent.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { students: true } }),
      prisma.parent.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return handleError({ code: "P2025" });
    const { studentIds, ...data } = parentSchema.parse(await req.json());
    const parent = await prisma.parent.create({
      data: { ...data, students: studentIds?.length ? { connect: studentIds.map((id) => ({ id })) } : undefined },
      include: { students: true },
    });
    return created(parent);
  } catch (e) {
    return handleError(e);
  }
}
