import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { requireAppAuth, sinceParam, serverTime } from "@/lib/app-api";
import { runWithTenant } from "@/lib/tenant-context";
import { tenantWhere } from "@/lib/tenant";

// GET — fees/invoices (and light payment summary) for the child. ?since= for deltas.
export async function GET(req: NextRequest) {
  try {
    const auth = requireAppAuth(req);
    if (!auth.ok) return fail("Unauthorized.", auth.status);

    const student = await prisma.student.findUnique({ where: { id: auth.studentId }, select: { schoolId: true } });
    if (!student) return fail("Student not found.", 404);

    return runWithTenant({ schoolId: student.schoolId }, async () => {
      const since = sinceParam(req);
      const [invoices, payments] = await Promise.all([
        prisma.invoice.findMany({
          where: tenantWhere({ studentId: auth.studentId, ...(since ? { updatedAt: { gte: since } } : {}) }),
          include: { items: true }, orderBy: { createdAt: "desc" },
        }),
        prisma.payment.findMany({
          where: tenantWhere({ invoice: { studentId: auth.studentId }, ...(since ? { updatedAt: { gte: since } } : {}) }),
          orderBy: { receivedAt: "desc" }, take: since ? undefined : 30,
        }),
      ]);
      const outstanding = invoices
        .filter((i) => i.status !== "PAID" && i.status !== "CANCELLED")
        .reduce((s, i) => s + Math.max(0, (i.total ?? 0) - (i.paidTotal ?? 0)), 0);
      return ok({ serverTime: serverTime(), outstanding, invoices, payments });
    });
  } catch (e) { return handleError(e); }
}
