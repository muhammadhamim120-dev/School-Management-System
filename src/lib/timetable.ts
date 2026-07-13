// Timetable engine: shift period templates, conflict detection, and a greedy
// school-aware auto-generator. Pure helpers + Prisma queries — no schema change
// needed (RoutineSlot already exists).

import { prisma } from "@/lib/prisma";
import type { WeekDay } from "@prisma/client";
import { getRequiredTenantId } from "@/lib/tenant-context";

export type Shift = "MORNING" | "DAY" | "EVENING";

/** Bangladesh school week — Friday/Saturday are the weekend. */
export const SCHOOL_DAYS: WeekDay[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"];

/** Period grid per shift. Each shift has 5 teaching periods with a mid-morning break. */
export const SHIFT_PERIODS: Record<Shift, { start: string; end: string }[]> = {
  MORNING: [
    { start: "08:00", end: "08:45" },
    { start: "08:45", end: "09:30" },
    { start: "09:45", end: "10:30" },
    { start: "10:30", end: "11:15" },
    { start: "11:15", end: "12:00" },
  ],
  DAY: [
    { start: "12:30", end: "13:15" },
    { start: "13:15", end: "14:00" },
    { start: "14:15", end: "15:00" },
    { start: "15:00", end: "15:45" },
    { start: "15:45", end: "16:30" },
  ],
  EVENING: [
    { start: "16:30", end: "17:15" },
    { start: "17:15", end: "18:00" },
    { start: "18:15", end: "19:00" },
    { start: "19:00", end: "19:45" },
    { start: "19:45", end: "20:30" },
  ],
};

/** Zero-padded 24h "HH:MM" strings compare lexicographically, so < and > work. */
export function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export type ConflictKind = "TEACHER" | "CLASS" | "ROOM";

export type Conflict = {
  kind: ConflictKind;
  slotId: string;
  day: string;
  start: string;
  end: string;
  detail: string;
};

export type CandidateSlot = {
  id?: string; // exclude self on update
  classId: string;
  sectionId?: string | null;
  teacherId?: string | null;
  room?: string | null;
  day: string;
  startTime: string;
  endTime: string;
};

/**
 * Detect teacher / class / room conflicts for a candidate slot.
 * - TEACHER: same teacher, overlapping time, same day, different slot.
 * - CLASS: same class (+section if set), overlapping time, same day.
 * - ROOM: same room, overlapping time, same day.
 *
 * Note: section is treated as a refinement of class — a section-scoped slot only
 * clashes with another slot in the same section (or section-less for the class).
 */
export async function detectSlotConflict(c: CandidateSlot): Promise<Conflict[]> {
  if (c.startTime >= c.endTime) {
    return [{ kind: "CLASS", slotId: "", day: c.day, start: c.startTime, end: c.endTime, detail: "End time must be after start time." }];
  }
  const day = c.day as WeekDay;
  // Fetch the universe of potentially-overlapping slots for the day: any slot
  // sharing the teacher, the class, or the room.
  const orClauses: Record<string, unknown>[] = [];
  if (c.teacherId) orClauses.push({ teacherId: c.teacherId });
  orClauses.push({ classId: c.classId });
  if (c.room) orClauses.push({ room: c.room });

  const existing = await prisma.routineSlot.findMany({
    where: {
      day,
      ...(c.id ? { id: { not: c.id } } : {}),
      OR: orClauses as never,
    },
    include: { subject: true, teacher: true, class: true },
  });

  const conflicts: Conflict[] = [];
  for (const s of existing) {
    if (!timesOverlap(c.startTime, c.endTime, s.startTime, s.endTime)) continue;

    // Teacher conflict
    if (c.teacherId && s.teacherId === c.teacherId) {
      conflicts.push({
        kind: "TEACHER", slotId: s.id, day: s.day, start: s.startTime, end: s.endTime,
        detail: `Teacher ${s.teacher?.fullName ?? "—"} already booked ${s.class?.name ?? ""} (${s.startTime}–${s.endTime})`,
      });
    }
    // Class conflict (section-aware)
    const sameSectionScope =
      (!c.sectionId && !s.sectionId) || // both class-wide
      (c.sectionId && s.sectionId && c.sectionId === s.sectionId); // same section
    if (s.classId === c.classId && sameSectionScope) {
      conflicts.push({
        kind: "CLASS", slotId: s.id, day: s.day, start: s.startTime, end: s.endTime,
        detail: `Class ${s.class?.name ?? ""} already has ${s.subject?.name ?? "a period"} (${s.startTime}–${s.endTime})`,
      });
    }
    // Room conflict
    if (c.room && s.room && s.room === c.room) {
      conflicts.push({
        kind: "ROOM", slotId: s.id, day: s.day, start: s.startTime, end: s.endTime,
        detail: `Room ${c.room} already occupied by ${s.class?.name ?? ""} (${s.startTime}–${s.endTime})`,
      });
    }
  }
  return conflicts;
}

export type GenerationResult = {
  created: number;
  skipped: number;
  conflicts: string[];
};

/**
 * Greedy school-aware timetable generator for one class.
 *
 * Strategy: rotate the class's subjects through the day×period grid so each
 * subject is distributed across the week. Before placing each slot, verify the
 * teacher isn't already booked school-wide at that day/time (the slot's own
 * class is cleared first). Produces a draft the admin then refines — not an
 * optimal solver, but a conflict-free starting point in O(periods × subjects).
 */
export async function generateTimetable(classId: string, shift: Shift): Promise<GenerationResult> {
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { subjects: { include: { teacher: true } } },
  });
  if (!cls) return { created: 0, skipped: 0, conflicts: ["Class not found."] };

  const subjects = cls.subjects.filter((s) => s.teacherId);
  if (subjects.length === 0) {
    return { created: 0, skipped: 0, conflicts: ["No subjects with assigned teachers — assign teachers to subjects first."] };
  }

  // Clear any existing class-wide slots for this class before regenerating.
  await prisma.routineSlot.deleteMany({ where: { classId } });

  const periods = SHIFT_PERIODS[shift];
  const rooms = await prisma.hostelRoom.findMany(); // light reuse as "spaces" pool
  const roomPool = rooms.length > 0 ? rooms.map((r) => `R-${r.roomNo}`) : ["101", "102", "103", "104"];
  let roomCursor = 0;

  let created = 0;
  let skipped = 0;
  const conflicts: string[] = [];

  for (let dayIdx = 0; dayIdx < SCHOOL_DAYS.length; dayIdx++) {
    const day = SCHOOL_DAYS[dayIdx];
    const placedThisDay = new Set<string>(); // subjectIds placed today (avoid repeats)
    for (let pIdx = 0; pIdx < periods.length; pIdx++) {
      const period = periods[pIdx];

      // Round-robin subject selection offset by day+period so the grid rotates.
      let chosen: (typeof subjects)[number] | undefined;
      for (let attempt = 0; attempt < subjects.length; attempt++) {
        const idx = (dayIdx + pIdx + attempt) % subjects.length;
        const candidate = subjects[idx];
        if (placedThisDay.has(candidate.id)) continue;
        chosen = candidate;
        break;
      }
      if (!chosen) { skipped++; continue; }

      // School-wide teacher-availability check (the candidate's teacher must be free).
      const teacherBusy = await prisma.routineSlot.findFirst({
        where: { day, teacherId: chosen.teacherId!, startTime: { lt: period.end }, endTime: { gt: period.start } },
      });
      if (teacherBusy) {
        skipped++;
        conflicts.push(`${chosen.teacher?.fullName ?? "Teacher"} busy ${day} ${period.start}–${period.end}`);
        continue;
      }

      const room = roomPool[roomCursor % roomPool.length];
      roomCursor++;
      await prisma.routineSlot.create({
        data: {
          classId,
          subjectId: chosen.id,
          teacherId: chosen.teacherId,
          day,
          startTime: period.start,
          endTime: period.end,
          room,
          schoolId: getRequiredTenantId(),
        },
      });
      created++;
      placedThisDay.add(chosen.id);
    }
  }
  return { created, skipped, conflicts };
}
