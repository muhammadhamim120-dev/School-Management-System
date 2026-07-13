import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { boardRegistrationSchema } from "@/lib/validations";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

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

function toXlsHtml(rows: Record<string, unknown>[], sheetTitle: string): string {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const esc = (v: unknown) => String(v ?? "").replace(/[&<>]/g, (c) => c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;");
  const head = headers.map((h) => `<th style="background:#f1f5f9;font-weight:600">${esc(h)}</th>`).join("");
  const body = rows.map((r) => `<tr>${headers.map((h) => `<td>${esc(r[h])}</td>`).join("")}</tr>`).join("");
  return `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${sheetTitle}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
}

export const GET = withTenantContext(async (req: NextRequest) => {
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
    const where = tenantWhere(AND.length ? { AND } : {});

    if (format === "csv" || format === "xls") {
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
      if (format === "xls") {
        return new Response(toXlsHtml(rows, "Board Registrations"), {
          headers: {
            "Content-Type": "application/vnd.ms-excel; charset=utf-8",
            "Content-Disposition": `attachment; filename="board-registrations.xls"`,
          },
        });
      }
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
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const data = boardRegistrationSchema.parse(await req.json());
    const schoolId = getRequiredTenantId();
    const item = await prisma.boardRegistration.upsert({
      where: { studentId_boardExam_examYear: { studentId: data.studentId, boardExam: data.boardExam, examYear: data.examYear } },
      update: { regNumber: data.regNumber, rollNumber: data.rollNumber, boardName: data.boardName, status: data.status },
      create: { ...data, schoolId },
      include: { student: true },
    });
    return created(item);
  } catch (e) { return handleError(e); }
});
