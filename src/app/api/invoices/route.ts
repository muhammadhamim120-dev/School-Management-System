import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { invoiceSchema } from "@/lib/validations";
import { computeInvoiceTotals, deriveInvoiceStatus, nextInvoiceNo } from "@/lib/finance";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status")?.trim();
    const studentId = sp.get("studentId")?.trim();

    const AND: Record<string, unknown>[] = [];
    if (search) AND.push({ invoiceNo: { contains: search, mode: "insensitive" as const } });
    if (status) AND.push({ status });
    if (studentId) AND.push({ studentId });
    const where = tenantWhere(AND.length ? { AND } : {});

    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where, skip, take: limit, orderBy: { createdAt: "desc" },
        include: { student: true, items: true, payments: true },
      }),
      prisma.invoice.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const data = invoiceSchema.parse(await req.json());
    const schoolId = getRequiredTenantId();
    const { subtotal, discountTotal, total } = computeInvoiceTotals(data.items);
    const count = await prisma.invoice.count({ where: tenantWhere({}) });
    const invoiceNo = nextInvoiceNo(count + 1);
    const status = deriveInvoiceStatus({ total, paidTotal: 0, dueDate: data.dueDate, current: data.status });

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        studentId: data.studentId,
        dueDate: data.dueDate,
        period: data.period,
        notes: data.notes,
        status,
        subtotal, discountTotal, total, paidTotal: 0,
        schoolId,
        items: {
          create: data.items.map((it) => ({
            categoryId: it.categoryId || null,
            description: it.description,
            amount: it.amount,
            discount: it.discount ?? 0,
          })),
        },
      },
      include: { student: true, items: true, payments: true },
    });
    return created(invoice);
  } catch (e) { return handleError(e); }
});
