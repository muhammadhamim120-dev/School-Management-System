import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";

export async function GET(_req: NextRequest) {
  try {
    const now = new Date();
    const [totalBooks, totalCopies, copyStatus, activeLoans, overdue, fineAgg, recentLoans, topCategories] = await Promise.all([
      prisma.book.count(),
      prisma.bookCopy.count(),
      prisma.bookCopy.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.bookLoan.count({ where: { status: "ISSUED" } }),
      prisma.bookLoan.count({ where: { status: "ISSUED", dueDate: { lt: now } } }),
      prisma.bookLoan.aggregate({ _sum: { fineAmount: true }, where: { finePaid: true } }),
      prisma.bookLoan.findMany({ orderBy: { issuedAt: "desc" }, take: 5, include: { copy: { include: { book: true } }, student: true, teacher: true } }),
      prisma.book.groupBy({ by: ["categoryId"], _count: { _all: true }, orderBy: { _count: { categoryId: "desc" } }, take: 5 }),
    ]);

    const categoryIds = topCategories.map((c: { categoryId: string | null }) => c.categoryId).filter(Boolean) as string[];
    const cats = categoryIds.length ? await prisma.bookCategory.findMany({ where: { id: { in: categoryIds } } }) : [];
    const catName = (id: string | null) => cats.find((c: { id: string }) => c.id === id)?.name ?? "Uncategorized";

    return ok({
      totalBooks,
      totalCopies,
      copyStatus: copyStatus.map((s: { status: string; _count: { _all: number } }) => ({ status: s.status, count: s._count._all })),
      activeLoans,
      overdue,
      finesCollected: fineAgg._sum.fineAmount ?? 0,
      recentLoans,
      topCategories: topCategories.map((c: { categoryId: string | null; _count: { _all: number } }) => ({ name: catName(c.categoryId), count: c._count._all })),
    });
  } catch (e) { return handleError(e); }
}
