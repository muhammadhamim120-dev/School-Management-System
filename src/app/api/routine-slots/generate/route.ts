import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, handleError } from "@/lib/api";
import { generateTimetable, type Shift } from "@/lib/timetable";
import { withTenantContext } from "@/lib/api-helpers";

// POST { classId, shift: "MORNING"|"DAY"|"EVENING" } -- auto-generate a draft
// timetable for a class. Clears existing class-wide slots first.
export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = z.object({
      classId: z.string().min(1),
      shift: z.enum(["MORNING", "DAY", "EVENING"]).optional(),
    }).parse(body);

    const shift: Shift = (parsed.shift as Shift) ?? "MORNING";
    const result = await generateTimetable(parsed.classId, shift);
    if (result.created === 0 && result.conflicts.length) {
      return fail(result.conflicts[0], 400, result);
    }
    return ok(result);
  } catch (e) { return handleError(e); }
});
