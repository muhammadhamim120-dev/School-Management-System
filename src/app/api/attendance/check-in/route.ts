import { NextRequest } from "next/server";
import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { attendanceDay, getAttendanceConfig, isLate, type CheckInMethod, type CheckInRole } from "@/lib/attendance";
import { notifyParentAttendance } from "@/lib/attendance-notify";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

/**
 * Unified device/manual check-in endpoint.
 *
 * Body: { identifier: string, method: "QR"|"RFID"|"FINGERPRINT"|"MANUAL", role?: "STUDENT"|"TEACHER" }
 *
 * The `identifier` is the value encoded in a QR code, emitted by an RFID
 * keyboard-wedge reader, or resolved by a native fingerprint agent — it maps
 * to a student's `studentId` or a teacher's `teacherId`. Late detection runs
 * against Settings.schoolStartTime + lateThresholdMinutes, and an instant SMS
 * is dispatched to the parent when a student is marked LATE (or ABSENT) and
 * attendanceSmsEnabled is on.
 */
export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    let body: { identifier?: string; method?: string; role?: string };
    try {
      body = await req.json();
    } catch {
      return fail("Invalid JSON body.", 400);
    }

    const identifier = (body.identifier || "").trim();
    const method = ((body.method || "MANUAL").toUpperCase()) as CheckInMethod;
    const role = ((body.role || "STUDENT").toUpperCase()) as CheckInRole;

    if (!identifier) return fail("Missing identifier.", 400);
    if (!["MANUAL", "QR", "RFID", "FINGERPRINT"].includes(method)) {
      return fail("Invalid method.", 400);
    }

    const schoolId = getRequiredTenantId();
    const now = new Date();
    const day = attendanceDay(now);
    const cfg = await getAttendanceConfig();
    const late = isLate(now, cfg.schoolStartTime, cfg.lateThresholdMinutes);
    const status: "PRESENT" | "LATE" = late ? "LATE" : "PRESENT";

    if (role === "TEACHER") {
      const teacher = await prisma.teacher.findFirst({ where: tenantWhere({ teacherId: identifier }) });
      if (!teacher) return fail(`No teacher for identifier "${identifier}".`, 404);

      const record = await prisma.teacherAttendance.upsert({
        where: { teacherId_date: { teacherId: teacher.id, date: day } },
        update: { status, checkInTime: now, method, recordedBy: null },
        create: { teacherId: teacher.id, date: day, status, checkInTime: now, method, recordedBy: null, schoolId },
      });
      return ok({ record, role: "TEACHER", name: teacher.fullName, status, late });
    }

    const student = await prisma.student.findFirst({
      where: tenantWhere({ studentId: identifier }),
      include: { class: true },
    });
    if (!student) return fail(`No student for identifier "${identifier}".`, 404);

    const record = await prisma.attendance.upsert({
      where: { studentId_date: { studentId: student.id, date: day } },
      update: { status, checkInTime: now, method, recordedBy: null },
      create: { studentId: student.id, date: day, status, checkInTime: now, method, recordedBy: null, schoolId },
    });

    // Instant parent SMS when the student arrives late (or is absent elsewhere).
    // Fire-and-forget: never let an SMS failure fail the check-in.
    if (cfg.attendanceSmsEnabled && (status === "LATE")) {
      notifyParentAttendance(student.id, status, day).catch(() => {});
    }

    return ok({ record, role: "STUDENT", name: student.fullName, className: student.class?.name ?? null, status, late });
  } catch (e) {
    return handleError(e);
  }
});
