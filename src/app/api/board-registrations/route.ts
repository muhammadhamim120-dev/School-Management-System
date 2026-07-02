import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { boardRegistrationSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => escape(r[h])).join(","));
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
    const sp = req.nextUrl.searchParams;
    const boardExam = sp.get("boardExam")?.trim();
    const status = sp.get("status")?.trim();
    const examYear = sp.get("examYear")?.trim();
    const format = sp.get("format")?.trim();

    const AND: Record<string, unknown>[] = [];
    if (boardExam) AND.push({ boardExam });
    if (status) AND.push({ status });
    if (examYear) AND.push({ examYear: Number(examYear) });
    const where = AND.length ? { AND } : {};

    // Export: return all matching rows as CSV.
    if (format === "csv") {
      const all = await prisma.boardRegistration.findMany({
        where, orderBy: { createdAt: "desc" },
        include: { student: true },
      });
      const rows = all.map((r: {
        student: { studentId: string; fullName: string } | null;
        boardExam: string; examYear: number; regNumber: string | null;
        rollNumber: string | null; boardName: string | null; status: string;
      }) => ({
        studentId: r.student?.studentId ?? "",
        studentName: r.student?.fullName ?? "",
        boardExam: r.boardExam,
        examYear: r.examYear,
        regNumber: r.regNumber ?? "",
        rollNumber: r.rollNumber ?? "",
        boardName: r.boardName ?? "",
        status: r.status,
      }));
      return new Response(toCsv(rows), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="board-registrations.csv"`,
        },
      });
    }

    const [items, total] = await Promise.all([
      prisma.boardRegistration.findMany({
        where, skip, take: limit, orderBy: { createdAt: "desc" },
        include: { student: true },
      }),
      prisma.boardRegistration.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const authSession = await auth();
    if (!authSession) return handleError({ code: "P2025" });
    const data = boardRegistrationSchema.parse(await req.json());
    const item = await prisma.boardRegistration.upsert({
      where: { studentId_boardExam_examYear: { studentId: data.studentId, boardExam: data.boardExam, examYear: data.examYear } },
      update: { regNumber: data.regNumber, rollNumber: data.rollNumber, boardName: data.boardName, status: data.status },
      create: data,
      include: { student: true },
    });
    return created(item);
  } catch (e) { return handleError(e); }
}
