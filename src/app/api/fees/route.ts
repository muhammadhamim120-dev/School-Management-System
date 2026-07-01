import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { feeSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const where = search ? { title: { contains: search, mode: "insensitive" as const } } : {};
    const [items, total] = await Promise.all([
      prisma.fee.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { student: true } }),
      prisma.fee.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const data = feeSchema.parse(await req.json());
    let status = data.status;
    if (data.paidAmount >= data.amount && data.amount > 0) status = "PAID";
    else if (data.paidAmount > 0) status = "PARTIAL";
    return created(await prisma.fee.create({ data: { ...data, status }, include: { student: true } }));
  } catch (e) { return handleError(e); }
}
