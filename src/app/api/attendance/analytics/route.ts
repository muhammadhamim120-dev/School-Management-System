import { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";

/**
 * Attendance analytics. Optional `?month=YYYY-MM` (defaults to current month).
 * Returns overall rate + breakdown, daily rate for the window, rate by class,
 * and a per-student monthly summary (for the report / CSV export).
 */
export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const now = new Date();
    const monthParam = req.nextUrl.searchParams.get("month");
    let start = new Date(now.getFullYear(), now.getMonth(), 1);
    let end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    if (monthParam) {
      const [y, m] = monthParam.split("-").map(Number);
      if (Number.isFinite(y) && Number.isFinite(m)) {
        start = new Date(y, m - 1, 1);
        end = new Date(y, m, 1);
      }
    }

    const records = await prisma.attendance.findMany({
      where: tenantWhere({ date: { gte: start, lt: end } }),
      include: { student: { include: { class: true } } },
    });

    // Overall counts.
    const counts = { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 } as Record<string, number>;
    for (const r of records) counts[r.status] = (counts[r.status] ?? 0) + 1;
    const total = records.length;
    const presentish = counts.PRESENT + counts.LATE;
    const rate = total > 0 ? Math.round((presentish / total) * 100) : 0;

    // Daily rate across the window (for the trend line).
    const byDay = new Map<string, { presentish: number; total: number }>();
    for (const r of records) {
      const key = r.date.toISOString().slice(0, 10);
      const d = byDay.get(key) ?? { presentish: 0, total: 0 };
      d.total++;
      if (r.status === "PRESENT" || r.status === "LATE") d.presentish++;
      byDay.set(key, d);
    }
    const daily = [...byDay.entries()]
      .map(([date, v]) => ({ date, rate: v.total > 0 ? Math.round((v.presentish / v.total) * 100) : 0 }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    // Rate by class.
    const byClassMap = new Map<string, { className: string; presentish: number; total: number }>();
    for (const r of records) {
      const className = r.student?.class?.name ?? "—";
      const key = r.student?.classId ?? "none";
      const c = byClassMap.get(key) ?? { className, presentish: 0, total: 0 };
      c.total++;
      if (r.status === "PRESENT" || r.status === "LATE") c.presentish++;
      byClassMap.set(key, c);
    }
    const byClass = [...byClassMap.values()]
      .map((c) => ({ className: c.className, rate: c.total > 0 ? Math.round((c.presentish / c.total) * 100) : 0, count: c.total }))
      .sort((a, b) => b.rate - a.rate);

    // Per-student monthly summary (for the report / CSV).
    const byStudentMap = new Map<
      string,
      { studentId: string; name: string; className: string; present: number; late: number; absent: number; excused: number }
    >();
    for (const r of records) {
      const key = r.studentId;
      const s =
        byStudentMap.get(key) ??
        { studentId: r.student?.studentId ?? "—", name: r.student?.fullName ?? "—", className: r.student?.class?.name ?? "—", present: 0, late: 0, absent: 0, excused: 0 };
      if (r.status === "PRESENT") s.present++;
      else if (r.status === "LATE") s.late++;
      else if (r.status === "ABSENT") s.absent++;
      else if (r.status === "EXCUSED") s.excused++;
      byStudentMap.set(key, s);
    }
    const monthly = [...byStudentMap.values()]
      .map((s) => {
        const total = s.present + s.late + s.absent + s.excused;
        return { ...s, rate: total > 0 ? Math.round(((s.present + s.late) / total) * 100) : 0 };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return ok({ month: start.toISOString().slice(0, 7), overall: { rate, total, ...counts }, daily, byClass, monthly });
  } catch (e) {
    return handleError(e);
  }
});
