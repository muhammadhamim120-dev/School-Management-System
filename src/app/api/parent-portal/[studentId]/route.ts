import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

// Aggregated read-only view for a single child. Reuses existing tables; no new schema.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { studentId } = await params;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true, section: true, parent: true },
    });
    if (!student) return handleError({ code: "P2025" });

    const [attendance, results, invoices, transport, hostel, notices] = await Promise.all([
      prisma.attendance.groupBy({ by: ["status"], where: { studentId }, _count: { _all: true } }),
      prisma.result.findMany({ where: { studentId }, include: { exam: true, subject: true }, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.invoice.findMany({ where: { studentId }, orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.studentTransport.findMany({ where: { studentId, status: "ACTIVE" }, include: { route: true, stop: true } }),
      prisma.hostelAllocation.findMany({ where: { studentId, status: "ACTIVE" }, include: { room: { include: { building: true } } } }),
      prisma.notice.findMany({ orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: 8 }),
    ]);

    const attendanceSummary: Record<string, number> = {};
    for (const a of attendance as { status: string; _count: { _all: number } }[]) {
      attendanceSummary[a.status] = a._count._all;
    }
    const totalDays: number = Object.values(attendanceSummary).reduce((s: number, n: number) => s + n, 0);
    const present = (attendanceSummary.PRESENT ?? 0) + (attendanceSummary.LATE ?? 0);
    const attendanceRate = totalDays > 0 ? Math.round((present / totalDays) * 100) : null;

    const outstanding = invoices.reduce((s: number, inv: { total: number; paidTotal: number; status: string }) => {
      if (inv.status === "CANCELLED" || inv.status === "PAID") return s;
      return s + Math.max(0, (inv.total ?? 0) - (inv.paidTotal ?? 0));
    }, 0);

    return ok({
      student: {
        id: student.id, name: student.fullName, roll: student.rollNumber, photo: student.photo,
        class: student.class?.name ?? null, section: student.section?.name ?? null,
        parent: student.parent ? { name: student.parent.fullName, phone: student.parent.phone } : null,
      },
      attendance: { summary: attendanceSummary, totalDays, rate: attendanceRate },
      results,
      invoices,
      outstanding,
      transport,
      hostel,
      notices,
    });
  } catch (e) { return handleError(e); }
}
