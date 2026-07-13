import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";

// GET — batch report: enrollment, attendance rate (last 30 days), fee collection.
export const GET = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id: batchId } = await params;

    const batch = await prisma.coachingBatch.findUnique({ where: { id: batchId }, include: { subject: true, teacher: true } });
    if (!batch) return handleError({ code: "P2025" });

    const [activeEnrollments, totalEnrollments] = await Promise.all([
      prisma.batchEnrollment.count({ where: { batchId, status: "ACTIVE" } }),
      prisma.batchEnrollment.count({ where: { batchId } }),
    ]);

    // Attendance rate over the last 30 days.
    const since = new Date(); since.setDate(since.getDate() - 30); since.setHours(0, 0, 0, 0);
    const att = await prisma.batchAttendance.groupBy({
      by: ["status"], where: { batchId, date: { gte: since } }, _count: { _all: true },
    });
    const attMap: Record<string, number> = {};
    for (const a of att as { status: string; _count: { _all: number } }[]) attMap[a.status] = a._count._all;
    const attTotal = Object.values(attMap).reduce((s, n) => s + n, 0);
    const attPresentish = (attMap.PRESENT ?? 0) + (attMap.LATE ?? 0);
    const attendanceRate = attTotal > 0 ? Math.round((attPresentish / attTotal) * 100) : null;

    // Fee collection: invoices tagged with this batch's period prefix.
    const invoices = await prisma.invoice.findMany({
      where: tenantWhere({ period: { startsWith: `coaching-${batchId}-` } }),
      select: { total: true, paidTotal: true, status: true },
    });
    const invoiced = invoices.reduce((s, i) => s + (i.total ?? 0), 0);
    const collected = invoices.reduce((s, i) => s + (i.paidTotal ?? 0), 0);
    const outstanding = invoiced - collected;

    return ok({
      batch: { id: batch.id, name: batch.name, subject: batch.subject?.name ?? null, teacher: batch.teacher?.fullName ?? null },
      enrollment: { active: activeEnrollments, total: totalEnrollments, capacity: batch.capacity },
      attendance: { rate: attendanceRate, breakdown: attMap, records: attTotal },
      fees: { invoiced, collected, outstanding, invoiceCount: invoices.length },
    });
  } catch (e) { return handleError(e); }
});
