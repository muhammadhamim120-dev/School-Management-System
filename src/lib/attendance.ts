// Attendance helpers: late-detection rule, day keying, config read.

import { prisma } from "@/lib/prisma";

export type CheckInRole = "STUDENT" | "TEACHER";
export type CheckInMethod = "MANUAL" | "QR" | "RFID" | "FINGERPRINT";

/** Read the attendance config from the singleton Settings row (with safe defaults). */
export async function getAttendanceConfig() {
  const s = await prisma.setting.findFirst();
  return {
    schoolStartTime: s?.schoolStartTime ?? "08:30",
    lateThresholdMinutes: s?.lateThresholdMinutes ?? 10,
    attendanceSmsEnabled: s?.attendanceSmsEnabled ?? true,
  };
}

/**
 * Is `now` late? Late = after (schoolStartTime + graceMinutes).
 * Times are compared in the server's local timezone (school timezone).
 */
export function isLate(now: Date, schoolStartTime: string, graceMinutes: number): boolean {
  const parts = schoolStartTime.split(":").map(Number);
  const h = parts[0];
  const m = parts[1];
  if (!Number.isFinite(h) || !Number.isFinite(m)) return false;
  const start = new Date(now);
  start.setHours(h, m, 0, 0);
  const deadline = new Date(start.getTime() + Math.max(0, graceMinutes) * 60 * 1000);
  return now.getTime() > deadline.getTime();
}

/** Local-midnight date used as the unique [person, date] key for a day. */
export function attendanceDay(d: Date = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
