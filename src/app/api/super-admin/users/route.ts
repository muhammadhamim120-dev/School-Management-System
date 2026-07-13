import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/api-auth";
import { hashPassword } from "@/lib/password";

export const GET = async (req: NextRequest) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          schoolId: true,
          createdAt: true,
          organization: { select: { name: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    return handleError(e);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const body = await req.json();
    const { name, email, password, role, schoolId } = body;

    if (!email || !password) {
      return handleError({ code: "P2025", message: "Email and password required" });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "ADMIN",
        schoolId: schoolId || null,
      },
      select: { id: true, name: true, email: true, role: true, schoolId: true, createdAt: true },
    });

    return created(user);
  } catch (e) {
    return handleError(e);
  }
};
