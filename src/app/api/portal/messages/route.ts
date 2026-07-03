import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { verifyPortalToken } from "@/lib/portal-token";

const schema = z.object({ body: z.string().min(1).max(1000), teacherId: z.string().optional() });

export async function POST(req: NextRequest) {
  try {
    const v = verifyPortalToken(req.headers.get("authorization")?.replace(/^Bearer\s+/i, ""));
    if (!v.ok) return fail("Session expired.", 401);
    let raw: unknown; try { raw = await req.json(); } catch { return fail("Invalid body.", 400); }
    const { body, teacherId } = schema.parse(raw);
    const msg = await prisma.parentMessage.create({ data: { studentId: v.studentId, teacherId: teacherId || null, sender: "PARENT", body } });
    return ok(msg);
  } catch (e) { return handleError(e); }
}
