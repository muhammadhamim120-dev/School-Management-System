import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError, parsePagination } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const sp = req.nextUrl.searchParams;
    const event = sp.get("event")?.trim();
    const gateway = sp.get("gateway")?.trim();
    const status = sp.get("status")?.trim();
    const AND: Record<string, unknown>[] = [];
    if (event) AND.push({ event });
    if (gateway) AND.push({ gateway });
    if (status) AND.push({ status });
    if (search) AND.push({ gatewayRef: { contains: search, mode: "insensitive" as const } });
    const where = AND.length ? { AND } : {};
    const [items, total] = await Promise.all([
      prisma.paymentTransaction.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.paymentTransaction.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
}
