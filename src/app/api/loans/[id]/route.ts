import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { returnLoanSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";
import { z } from "zod";

// PATCH handles both "return" and "renew" actions via ?action=.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    const action = req.nextUrl.searchParams.get("action") ?? "return";
    const body = await req.json().catch(() => ({}));

    if (action === "renew") {
      const days = z.coerce.number().int().min(1).max(90).parse(body.days ?? 7);
      const loan = await prisma.bookLoan.findUnique({ where: { id } });
      if (!loan) return handleError({ code: "P2025" });
      const base = loan.dueDate > new Date() ? loan.dueDate : new Date();
      const dueDate = new Date(base.getTime() + days * 86400000);
      return ok(await prisma.bookLoan.update({ where: { id }, data: { dueDate, renewCount: { increment: 1 }, status: "ISSUED" },
        include: { copy: { include: { book: true } }, student: true, teacher: true } }));
    }

    // return / lost / damaged
    const data = returnLoanSchema.parse(body);
    const result = await prisma.$transaction(async (tx: typeof prisma) => {
      const loan = await tx.bookLoan.findUnique({ where: { id } });
      if (!loan) throw { code: "P2025" };
      const updated = await tx.bookLoan.update({ where: { id }, data: {
        status: data.status, returnedAt: new Date(),
        fineAmount: data.fineAmount ?? 0, finePaid: data.finePaid ?? false, note: data.note ?? loan.note,
      }, include: { copy: { include: { book: true } }, student: true, teacher: true } });
      // Copy status follows the loan outcome.
      const copyStatus = data.status === "LOST" ? "LOST" : data.status === "DAMAGED" ? "DAMAGED" : "AVAILABLE";
      await tx.bookCopy.update({ where: { id: loan.copyId }, data: { status: copyStatus } });
      return updated;
    });
    return ok(result);
  } catch (e) { return handleError(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    await prisma.bookLoan.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
}
