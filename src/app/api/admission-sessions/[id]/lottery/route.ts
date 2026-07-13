import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { generateTrackingCode, notifyApplicationStatus } from "@/lib/application-notify";
import { withTenantContext } from "@/lib/api-helpers";

// POST — run a randomized admission lottery for a session: randomly select up
// to `seats` applicants from the pool, mark them SHORTLISTED, the rest
// WAITLISTED. Ensures every applicant has a tracking code. Notifies each
// selected applicant via email + SMS (best-effort).
export const POST = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;

    const admSession = await prisma.admissionSession.findUnique({ where: { id } });
    if (!admSession) return handleError({ code: "P2025" });

    const pool = await prisma.application.findMany({
      where: { sessionId: id, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    });
    if (pool.length === 0) return fail("No eligible applications in the pool.", 400);

    // Fisher-Yates shuffle for an unbiased random draw.
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const seats = Math.max(0, admSession.seats);
    const winners = shuffled.slice(0, seats);
    const rest = shuffled.slice(seats);
    const winnerIds = new Set(winners.map((w) => w.id));

    // Ensure tracking codes exist for everyone.
    await Promise.all(pool
      .filter((a) => !a.trackingCode)
      .map((a) => prisma.application.update({ where: { id: a.id }, data: { trackingCode: generateTrackingCode() } })));

    await prisma.$transaction([
      prisma.application.updateMany({ where: { id: { in: [...winnerIds] } }, data: { status: "SHORTLISTED" } }),
      prisma.application.updateMany({ where: { id: { in: rest.map((r) => r.id) } }, data: { status: "WAITLISTED" } }),
    ]);

    // Best-effort notifications to winners.
    for (const w of winners) notifyApplicationStatus(w.id, "SHORTLISTED").catch(() => {});

    return ok({ selected: winners.length, waitlisted: rest.length, pool: pool.length });
  } catch (e) { return handleError(e); }
});
