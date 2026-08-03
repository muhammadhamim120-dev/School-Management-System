import { ok, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { withTenantContext } from "@/lib/api-helpers";
import { tenantWhere } from "@/lib/tenant";
import type { LoanStatus } from "@prisma/client";

export const GET = withTenantContext(async () => {
  try {
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.error;
    if (auth.user.role !== "STUDENT") return ok({ activeLoans: [], history: [] });

    const student = await prisma.student.findFirst({
      where: tenantWhere({ email: auth.user.email }),
      select: { id: true },
    });

    if (!student) return ok({ activeLoans: [], history: [] });

    const activeStatuses: LoanStatus[] = ["ISSUED", "OVERDUE"];
    const historyStatuses: LoanStatus[] = ["RETURNED", "LOST", "DAMAGED"];

    const [activeLoans, historyLoans] = await Promise.all([
      prisma.bookLoan.findMany({
        // BookLoan has no schoolId column; scoped via the (tenant-checked) student.
        where: { studentId: student.id, status: { in: activeStatuses } },
        include: { copy: { include: { book: true } } },
        orderBy: { issuedAt: "desc" },
      }),
      prisma.bookLoan.findMany({
        // BookLoan has no schoolId column; scoped via the (tenant-checked) student.
        where: { studentId: student.id, status: { in: historyStatuses } },
        include: { copy: { include: { book: true } } },
        orderBy: { issuedAt: "desc" },
        take: 30,
      }),
    ]);

    const mapLoan = (l: (typeof activeLoans)[0]) => ({
      id: l.id,
      bookTitle: l.copy.book.title,
      copyCode: l.copy.copyCode,
      issuedAt: l.issuedAt.toISOString(),
      dueDate: l.dueDate.toISOString(),
      returnedAt: l.returnedAt?.toISOString() ?? null,
      status: l.status,
      fineAmount: l.fineAmount,
    });

    return ok({
      activeLoans: activeLoans.map(mapLoan),
      history: historyLoans.map(mapLoan),
    });
  } catch (e) {
    return handleError(e);
  }
});
