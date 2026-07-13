import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError } from "@/lib/api";
import { batchAttendanceSchema } from "@/lib/validations";
import { withTenantContext } from "@/lib/api-helpers";

// GET ?date=YYYY-MM-DD — batch attendance for a day (one row per active enrollee).
export const GET = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id: batchId } = await params;
    const dateParam = req.nextUrl.searchParams.get("date");
    let dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
    let dayEnd = new Date(dayStart); dayEnd.setDate(dayStart.getDate() + 1);
    if (dateParam) {
      dayStart = new Date(dateParam); dayStart.setHours(0, 0, 0, 0);
      dayEnd = new Date(dayStart); dayEnd.setDate(dayStart.getDate() + 1);
    }
    const [records, enrollments] = await Promise.all([
      prisma.batchAttendance.findMany({ where: { batchId, date: { gte: dayStart, lt: dayEnd } } }),
      prisma.batchEnrollment.findMany({ where: { batchId, status: "ACTIVE" }, include: { student: true } }),
    ]);
    const byStudent = new Map(records.map((r) => [r.studentId, r]));
    return ok({
      date: dayStart.toISOString().slice(0, 10),
      items: enrollments.map((e) => ({
        enrollmentId: e.id,
        studentId: e.studentId,
        name: e.student.fullName,
        status: byStudent.get(e.studentId)?.status ?? null,
      })),
    });
  } catch (e) { return handleError(e); }
});

// POST { date, records: [{ studentId, status }] } — bulk upsert batch attendance.
export const POST = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id: batchId } = await params;
    const { date, records } = batchAttendanceSchema.parse(await req.json());
    const day = new Date(date); day.setHours(0, 0, 0, 0);

    const results = await Promise.all(
      records.map((r: { studentId: string; status: string }) =>
        prisma.batchAttendance.upsert({
          where: { batchId_studentId_date: { batchId, studentId: r.studentId, date: day } },
          update: { status: r.status as never },
          create: { batchId, studentId: r.studentId, date: day, status: r.status as never },
        })
      )
    );
    return created(results);
  } catch (e) { return handleError(e); }
});
