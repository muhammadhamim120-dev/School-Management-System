import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError } from "@/lib/api";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

// GET today's (or ?date=) teacher attendance records.
export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const date = req.nextUrl.searchParams.get("date");
    const where: Record<string, unknown> = {};
    if (date) {
      const d = new Date(date);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      where.date = { gte: d, lt: next };
    }
    const items = await prisma.teacherAttendance.findMany({
      where: tenantWhere(where), orderBy: { date: "desc" }, include: { teacher: true },
    });
    return ok({ items, total: items.length });
  } catch (e) { return handleError(e); }
});

// POST { records: [{ teacherId, date, status }] } for bulk manual marking.
export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const schoolId = getRequiredTenantId();
    const records = Array.isArray(body?.records) ? body.records : [body];
    const results = await Promise.all(
      (records as { teacherId: string; date: string; status: string }[]).map((r) =>
        prisma.teacherAttendance.upsert({
          where: { teacherId_date: { teacherId: r.teacherId, date: new Date(r.date) } },
          update: { status: r.status as never, method: "MANUAL", recordedBy: null },
          create: {
            teacherId: r.teacherId,
            date: new Date(r.date),
            status: r.status as never,
            method: "MANUAL",
            recordedBy: null,
            schoolId,
          },
        })
      )
    );
    return created(results);
  } catch (e) { return handleError(e); }
});
