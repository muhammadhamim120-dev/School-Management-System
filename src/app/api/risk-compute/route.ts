import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { scoreRisk } from "@/lib/risk";

// Recompute risk for every active student from current attendance, dues, results.
export async function POST(_req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const students = await prisma.student.findMany({ where: { status: "ACTIVE" }, select: { id: true } });

    let created = 0;
    for (const s of students as { id: string }[]) {
      const [attendance, invoices, results] = await Promise.all([
        prisma.attendance.groupBy({ by: ["status"], where: { studentId: s.id }, _count: { _all: true } }),
        prisma.invoice.findMany({ where: { studentId: s.id }, select: { total: true, paidTotal: true, status: true } }),
        prisma.result.findMany({ where: { studentId: s.id }, select: { marks: true, totalMarks: true } }),
      ]);

      const attMap: Record<string, number> = {};
      for (const a of attendance as { status: string; _count: { _all: number } }[]) attMap[a.status] = a._count._all;
      const totalDays = Object.values(attMap).reduce((x: number, n: number) => x + n, 0);
      const present = (attMap.PRESENT ?? 0) + (attMap.LATE ?? 0);
      const attendanceRate = totalDays > 0 ? (present / totalDays) * 100 : null;

      const duesAmount = (invoices as { total: number; paidTotal: number; status: string }[])
        .filter((i) => i.status !== "CANCELLED" && i.status !== "PAID")
        .reduce((x: number, i) => x + Math.max(0, (i.total ?? 0) - (i.paidTotal ?? 0)), 0);

      const resultRows = results as { marks: number; totalMarks: number }[];
      const avgResult = resultRows.length > 0
        ? resultRows.reduce((x: number, r) => x + (r.marks / (r.totalMarks || 100)) * 100, 0) / resultRows.length
        : null;

      const risk = scoreRisk({ attendanceRate, duesAmount, avgResult });
      await prisma.riskAssessment.create({ data: {
        studentId: s.id, score: risk.score, level: risk.level,
        attendanceRate, duesAmount, avgResult, factors: risk.factors.join("; "),
      } });
      created++;
    }
    return ok({ computed: created });
  } catch (e) { return handleError(e); }
}
