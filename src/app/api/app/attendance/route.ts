import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { requireAppAuth, sinceParam, serverTime } from "@/lib/app-api";
import { runWithTenant } from "@/lib/tenant-context";
import { tenantWhere } from "@/lib/tenant";

// GET — attendance records for the child. Supports ?since=<ISO> for delta sync.
export async function GET(req: NextRequest) {
  try {
    const auth = requireAppAuth(req);
    if (!auth.ok) return fail("Unauthorized.", auth.status);

    const student = await prisma.student.findUnique({ where: { id: auth.studentId }, select: { schoolId: true } });
    if (!student) return fail("Student not found.", 404);

    return runWithTenant({ schoolId: student.schoolId }, async () => {
      const since = sinceParam(req);
      const items = await prisma.attendance.findMany({
        where: tenantWhere({ studentId: auth.studentId, ...(since ? { date: { gte: since } } : {}) }),
        orderBy: { date: "desc" },
        take: since ? undefined : 90,
      });
      return ok({ serverTime: serverTime(), items });
    });
  } catch (e) { return handleError(e); }
}
