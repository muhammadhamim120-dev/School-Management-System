import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["DRAFT", "ISSUED", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  notes: z.string().optional(),
  dueDate: z.coerce.date().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { student: true, items: { include: { category: true } }, payments: { orderBy: { receivedAt: "desc" } } },
    });
    if (!invoice) return handleError({ code: "P2025" });
    return ok(invoice);
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    const data = patchSchema.parse(await req.json());
    return ok(await prisma.invoice.update({ where: { id }, data, include: { items: true, payments: true, student: true } }));
  } catch (e) { return handleError(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    await prisma.invoice.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
}
