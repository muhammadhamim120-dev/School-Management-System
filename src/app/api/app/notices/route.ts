import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { requireAppAuth, sinceParam, serverTime } from "@/lib/app-api";

// GET -- notices relevant to parents. ?since= for deltas.
export async function GET(req: NextRequest) {
  try {
    const auth = requireAppAuth(req);
    if (!auth.ok) return fail("Unauthorized.", auth.status);
    const since = sinceParam(req);

    const student = await prisma.student.findUnique({ where: { id: auth.studentId }, select: { schoolId: true } });
    const schoolId = student?.schoolId;

    const items = await prisma.notice.findMany({
      where: {
        ...(schoolId ? { schoolId } : {}),
        ...(since ? { updatedAt: { gte: since } } : {}),
        audience: { in: ["ALL", "PARENTS"] },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: since ? undefined : 40,
    });
    return ok({ serverTime: serverTime(), items });
  } catch (e) { return handleError(e); }
}
