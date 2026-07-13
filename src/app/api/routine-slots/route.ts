import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, created, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { detectSlotConflict } from "@/lib/timetable";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

const slotSchema = z.object({
  classId: z.string().min(1),
  sectionId: z.string().optional().nullable(),
  subjectId: z.string().optional().nullable(),
  teacherId: z.string().optional().nullable(),
  day: z.enum(["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  room: z.string().optional().nullable(),
});

// GET ?classId=&sectionId=&teacherId=&day= -- list slots with relations.
export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams;
    const where: Record<string, unknown> = {};
    if (sp.get("classId")) where.classId = sp.get("classId");
    if (sp.get("sectionId")) where.sectionId = sp.get("sectionId");
    if (sp.get("teacherId")) where.teacherId = sp.get("teacherId");
    if (sp.get("day")) where.day = sp.get("day");
    const items = await prisma.routineSlot.findMany({
      where, include: { subject: true, teacher: true, class: true, section: true }, orderBy: [{ day: "asc" }, { startTime: "asc" }],
    });
    return ok({ items, total: items.length });
  } catch (e) { return handleError(e); }
});

// POST -- create a slot after checking teacher/class/room conflicts (409 on clash).
export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const data = slotSchema.parse(body);

    const conflicts = await detectSlotConflict({
      classId: data.classId,
      sectionId: data.sectionId ?? null,
      teacherId: data.teacherId ?? null,
      room: data.room ?? null,
      day: data.day,
      startTime: data.startTime,
      endTime: data.endTime,
    });
    if (conflicts.length) return fail("Schedule conflict", 409, { conflicts });

    const slot = await prisma.routineSlot.create({ data: data as never, include: { subject: true, teacher: true } });
    return created(slot);
  } catch (e) { return handleError(e); }
});
