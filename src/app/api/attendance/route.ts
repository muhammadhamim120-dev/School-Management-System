import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError } from "@/lib/api";
import { attendanceSchema } from "@/lib/validations";
import { deleteCached, cacheKeys } from "@/lib/cache";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

export const GET = withTenantContext(async (req: NextRequest) => {
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
      where: tenantWhere(where), orderBy: { date: "desc" }, include: { student: true },
    });
    return ok({ items, total: items.length, page: 1, limit: items.length, totalPages: 1 });
  } catch (e) { return handleError(e); }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const schoolId = getRequiredTenantId();
    // Accept single record or bulk array under `records`
    if (Array.isArray(body?.records)) {
      const records = body.records.map((r: unknown) => attendanceSchema.parse(r));

      // Batch upsert using transaction for better performance
      const results = await prisma.$transaction(
        records.map((r: { studentId: string; date: Date; status: string; remark?: string }) =>
          prisma.attendance.upsert({
            where: { studentId_date: { studentId: r.studentId, date: r.date } },
            update: { status: r.status as never, remark: r.remark },
            create: { ...r, schoolId } as never,
          })
        )
      );

      // Invalidate dashboard cache when attendance changes
      deleteCached(cacheKeys.dashboard());

      return created(results);
    }
    const data = attendanceSchema.parse(body);
    const record = await prisma.attendance.upsert({
      where: { studentId_date: { studentId: data.studentId, date: data.date } },
      update: { status: data.status, remark: data.remark },
      create: { ...data, schoolId },
    });

    // Invalidate dashboard cache when attendance changes
    deleteCached(cacheKeys.dashboard());

    return created(record);
  } catch (e) { return handleError(e); }
});
