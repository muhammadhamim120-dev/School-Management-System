import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { verifyPortalToken } from "@/lib/portal-token";

const schema = z.object({
  fromDate: z.string().min(1),
  toDate: z.string().min(1),
  reason: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  try {
    const v = verifyPortalToken(req.headers.get("authorization")?.replace(/^Bearer\s+/i, ""));
    if (!v.ok) return fail("Session expired.", 401);
    let raw: unknown; try { raw = await req.json(); } catch { return fail("Invalid body.", 400); }
    const { fromDate, toDate, reason } = schema.parse(raw);
    const from = new Date(fromDate), to = new Date(toDate);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return fail("Invalid dates.", 400);
    if (to < from) return fail("End date must be on or after the start date.", 400);
    const leave = await prisma.leaveRequest.create({ data: { studentId: v.studentId, fromDate: from, toDate: to, reason, status: "PENDING" } });
    return ok(leave);
  } catch (e) { return handleError(e); }
}
