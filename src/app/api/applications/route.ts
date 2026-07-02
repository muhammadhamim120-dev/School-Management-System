import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { applicationSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, search, skip } = parsePagination(req.nextUrl.searchParams);
    const sp = req.nextUrl.searchParams;
    const sessionId = sp.get("sessionId")?.trim();
    const status = sp.get("status")?.trim();
    const sortField = sp.get("sortField")?.trim() ?? "appliedAt";
    const sortDir = sp.get("sortDir")?.trim() === "asc" ? "asc" : "desc";
    const sortable = ["appliedAt", "score", "applicantName"];
    const orderBy = sortable.includes(sortField) ? { [sortField]: sortDir as "asc" | "desc" } : { appliedAt: "desc" as const };
    const AND: Record<string, unknown>[] = [];
    if (search) AND.push({ applicantName: { contains: search, mode: "insensitive" as const } });
    if (sessionId) AND.push({ sessionId });
    if (status) AND.push({ status });
    const where = AND.length ? { AND } : {};
    const [items, total] = await Promise.all([
      prisma.application.findMany({ where, skip, take: limit, orderBy, include: { session: true } }),
      prisma.application.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
}
export async function POST(req: NextRequest) {
  try {
    // Public endpoint: online applications can be submitted without a session.
    const data = applicationSchema.parse(await req.json());
    return created(await prisma.application.create({ data: {
      sessionId: data.sessionId, applicantName: data.applicantName,
      dateOfBirth: data.dateOfBirth ?? null, gender: data.gender ?? null,
      guardianName: data.guardianName || null, guardianPhone: data.guardianPhone || null,
      email: data.email || null, address: data.address || null, previousSchool: data.previousSchool || null,
      classApplied: data.classApplied || null, score: data.score ?? 0, status: data.status ?? "SUBMITTED", note: data.note || null,
    }, include: { session: true } }));
  } catch (e) { return handleError(e); }
}
