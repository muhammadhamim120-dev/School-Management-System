import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { paymentSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";
import { deriveInvoiceStatus } from "@/lib/finance";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
    const sp = req.nextUrl.searchParams;
    const invoiceId = sp.get("invoiceId")?.trim();
    const status = sp.get("status")?.trim();
    const AND: Record<string, unknown>[] = [];
    if (invoiceId) AND.push({ invoiceId });
    if (status) AND.push({ status });
    const where = AND.length ? { AND } : {};
    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where, skip, take: limit, orderBy: { receivedAt: "desc" },
        include: { invoice: { include: { student: true } } },
      }),
      prisma.payment.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const data = paymentSchema.parse(await req.json());

    // Record payment and recompute the parent invoice atomically.
    const result = await prisma.$transaction(async (tx: typeof prisma) => {
      const payment = await tx.payment.create({ data: {
        invoiceId: data.invoiceId,
        amount: data.amount,
        method: data.method,
        status: data.status,
        gateway: data.gateway ?? null,
        gatewayRef: data.gatewayRef ?? null,
        note: data.note ?? null,
      }});

      const invoice = await tx.invoice.findUnique({ where: { id: data.invoiceId }, include: { payments: true } });
      if (!invoice) throw { code: "P2025" };

      const paidTotal = invoice.payments
        .filter((p: { status: string; amount: number }) => p.status === "SUCCESS")
        .reduce((s: number, p: { amount: number }) => s + p.amount, 0);
      const status = deriveInvoiceStatus({ total: invoice.total, paidTotal, dueDate: invoice.dueDate, current: invoice.status });

      await tx.invoice.update({ where: { id: invoice.id }, data: { paidTotal, status } });
      return payment;
    });
    return created(result);
  } catch (e) { return handleError(e); }
}
