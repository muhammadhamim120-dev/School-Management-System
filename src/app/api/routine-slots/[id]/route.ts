import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { detectSlotConflict } from "@/lib/timetable";
import { withTenantContext } from "@/lib/api-helpers";

const updateSchema = z.object({
  sectionId: z.string().optional().nullable(),
  subjectId: z.string().optional().nullable(),
  teacherId: z.string().optional().nullable(),
  day: z.enum(["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  room: z.string().optional().nullable(),
});

// PATCH -- update a slot, re-checking conflicts against the new fields.
export const PATCH = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const existing = await prisma.routineSlot.findUnique({ where: { id } });
    if (!existing) return handleError({ code: "P2025" });

    const body = await req.json();
    const data = updateSchema.parse(body);
    const merged = { ...existing, ...data };

    const conflicts = await detectSlotConflict({
      id: existing.id,
      classId: existing.classId,
      sectionId: merged.sectionId ?? null,
      teacherId: merged.teacherId ?? null,
      room: merged.room ?? null,
      day: merged.day,
      startTime: merged.startTime,
      endTime: merged.endTime,
    });
    if (conflicts.length) return fail("Schedule conflict", 409, { conflicts });

    const slot = await prisma.routineSlot.update({ where: { id }, data: data as never, include: { subject: true, teacher: true } });
    return ok(slot);
  } catch (e) { return handleError(e); }
});

// DELETE a slot.
export const DELETE = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    await prisma.routineSlot.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
});
