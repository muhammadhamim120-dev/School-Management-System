import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

// POST — generate monthly coaching invoices for all active enrollees.
// Idempotent: invoices are tagged with period `coaching-{batchId}-{YYYY-MM}`,
// so re-running for the same month skips students who already have one.
// Batch fees flow through the normal Invoice → Payment pipeline.
export const POST = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id: batchId } = await params;

    const body = await req.json().catch(() => ({}));
    const month = (body?.month as string | undefined) ?? new Date().toISOString().slice(0, 7); // YYYY-MM
    const period = `coaching-${batchId}-${month}`;

    const batch = await prisma.coachingBatch.findUnique({ where: { id: batchId } });
    if (!batch) return handleError({ code: "P2025" });
    if (batch.monthlyFee <= 0) return fail("Set a monthly fee on the batch first.", 400);

    // Ensure a COACHING fee category exists (reused across batches).
    const category = await prisma.feeCategory.upsert({
      where: { schoolId_name: { schoolId: getRequiredTenantId(), name: "Coaching Batch Fee" } },
      update: {},
      create: { name: "Coaching Batch Fee", type: "COACHING", recurrence: "MONTHLY", schoolId: getRequiredTenantId() },
    });

    const enrollments = await prisma.batchEnrollment.findMany({
      where: { batchId, status: "ACTIVE" },
      select: { studentId: true },
    });
    if (enrollments.length === 0) return fail("No active students enrolled.", 400);

    // Skip students already invoiced for this period.
    const existing = await prisma.invoice.findMany({
      where: tenantWhere({ period, studentId: { in: enrollments.map((e) => e.studentId) } }),
      select: { studentId: true },
    });
    const done = new Set(existing.map((i) => i.studentId));
    const due = enrollments.filter((e) => !done.has(e.studentId));

    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 15);
    const yyyymm = month.replace("-", "");
    let n = 0;
    for (const e of due) {
      await prisma.invoice.create({
        data: {
          invoiceNo: `COACH-${yyyymm}-${batchId.slice(-4).toUpperCase()}-${String(++n).padStart(3, "0")}`,
          studentId: e.studentId,
          dueDate,
          period,
          subtotal: batch.monthlyFee,
          discountTotal: 0,
          total: batch.monthlyFee,
          paidTotal: 0,
          status: "ISSUED",
          schoolId: getRequiredTenantId(),
          items: { create: [{ categoryId: category.id, description: `Coaching — ${batch.name} (${month})`, amount: batch.monthlyFee, discount: 0 }] },
        },
      });
    }
    return ok({ created: due.length, skipped: done.size, month });
  } catch (e) { return handleError(e); }
});
