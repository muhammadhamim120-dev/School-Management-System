import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { issueLoanSchema } from "@/lib/validations";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status")?.trim();
    const studentId = sp.get("studentId")?.trim();
    const teacherId = sp.get("teacherId")?.trim();
    const AND: Record<string, unknown>[] = [];
    if (status) AND.push({ status });
    if (studentId) AND.push({ studentId });
    if (teacherId) AND.push({ teacherId });
    const where = tenantWhere(AND.length ? { AND } : {});
    const [items, total] = await Promise.all([
      prisma.bookLoan.findMany({ where, skip, take: limit, orderBy: { issuedAt: "desc" },
        include: { copy: { include: { book: true } }, student: true, teacher: true } }),
      prisma.bookLoan.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const data = issueLoanSchema.parse(await req.json());

    const loan = await prisma.$transaction(async (tx) => {
      const copy = await tx.bookCopy.findUnique({ where: { id: data.copyId } });
      if (!copy) throw { code: "P2025" };
      if (copy.status !== "AVAILABLE") throw { code: "CONFLICT", message: "This copy is not available for issue." };
      const created = await tx.bookLoan.create({ data: {
        copyId: data.copyId,
        borrowerType: data.borrowerType,
        studentId: data.borrowerType === "STUDENT" ? (data.studentId || null) : null,
        teacherId: data.borrowerType === "TEACHER" ? (data.teacherId || null) : null,
        dueDate: data.dueDate,
        note: data.note || null,
        status: "ISSUED",
      }});
      await tx.bookCopy.update({ where: { id: data.copyId }, data: { status: "ISSUED" } });
      return created;
    });
    return created(loan);
  } catch (e) { return handleError(e); }
});
