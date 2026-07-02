import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";

// Transparent merit list: applicants ranked by score (desc), with seat cutoff.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await prisma.admissionSession.findUnique({ where: { id } });
    if (!session) return handleError({ code: "P2025" });
    const apps = await prisma.application.findMany({ where: { sessionId: id }, orderBy: [{ score: "desc" }, { appliedAt: "asc" }] });
    const ranked = apps.map((a: { id: string; applicantName: string; score: number; status: string }, i: number) => ({
      rank: i + 1, id: a.id, applicantName: a.applicantName, score: a.score, status: a.status,
      withinSeats: session.seats > 0 ? i < session.seats : true,
    }));
    return ok({ session, seats: session.seats, list: ranked });
  } catch (e) { return handleError(e); }
}
