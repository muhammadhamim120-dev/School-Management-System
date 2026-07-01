import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError } from "@/lib/api";
import { attendanceSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get("date");
    const studentId = req.nextUrl.searchParams.get("studentId") || undefined;
    const where: Record<string, unknown> = {};
    if (date) {
      const d = new Date(date);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      where.date = { gte: d, lt: next };
    }
    if (studentId) where.studentId = studentId;
    const items = await prisma.attendance.findMany({
      where, orderBy: { date: "desc" }, include: { student: true },
    });
    return ok({ items, total: items.length, page: 1, limit: items.length, totalPages: 1 });
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const body = await req.json();
    // Accept single record or bulk array under `records`
    if (Array.isArray(body?.records)) {
      const records = body.records.map((r: unknown) => attendanceSchema.parse(r));
      const results = await Promise.all(
        records.map((r: { studentId: string; date: Date; status: string; remark?: string }) =>
          prisma.attendance.upsert({
            where: { studentId_date: { studentId: r.studentId, date: r.date } },
            update: { status: r.status as never, remark: r.remark },
            create: r as never,
          })
        )
      );
      return created(results);
    }
    const data = attendanceSchema.parse(body);
    const record = await prisma.attendance.upsert({
      where: { studentId_date: { studentId: data.studentId, date: data.date } },
      update: { status: data.status, remark: data.remark },
      create: data,
    });
    return created(record);
  } catch (e) { return handleError(e); }
}
