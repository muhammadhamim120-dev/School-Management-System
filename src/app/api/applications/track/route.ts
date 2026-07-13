import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";

// POST { code?, phone? } — public, unauthenticated status lookup. Accepts
// either the tracking code (preferred) or the guardian phone. Returns a
// deliberately limited view (no internal notes / scores).
export async function POST(req: NextRequest) {
  try {
    let body: { code?: string; phone?: string };
    try { body = await req.json(); } catch { return fail("Invalid JSON body.", 400); }
    const code = body.code?.trim();
    const phone = body.phone?.trim();
    if (!code && !phone) return fail("Provide a tracking code or phone.", 400);

    const app = await prisma.application.findFirst({
      where: code ? { trackingCode: code } : { guardianPhone: phone },
      include: { session: true },
      orderBy: { appliedAt: "desc" },
    });
    if (!app) return fail("No application found.", 404);

    return ok({
      applicantName: app.applicantName,
      session: app.session.name,
      classApplied: app.classApplied ?? null,
      status: app.status,
      admitRoll: app.admitRoll,
      trackingCode: app.trackingCode,
      appliedAt: app.appliedAt,
    });
  } catch (e) { return handleError(e); }
}
