import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/api-auth";

export const GET = async (req: NextRequest) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const status = req.nextUrl.searchParams.get("status") || undefined;
    const priority = req.nextUrl.searchParams.get("priority") || undefined;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [items, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { organization: { select: { id: true, name: true } } },
      }),
      prisma.supportTicket.count({ where }),
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
    const { subject, description, organizationId, userId, priority } = body;

    if (!subject || !description) {
      return handleError({ code: "P2025", message: "Subject and description required" });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        subject,
        description,
        organizationId: organizationId || null,
        userId: userId || auth.user.id,
        priority: priority || "MEDIUM",
      },
      include: { organization: { select: { id: true, name: true } } },
    });

    return created(ticket);
  } catch (e) {
    return handleError(e);
  }
};
