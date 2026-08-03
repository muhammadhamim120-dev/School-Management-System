import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api";
import { verifyPortalToken } from "@/lib/portal-token";
import { computeGpa, formatGpa } from "@/lib/grading";
import { runWithTenant } from "@/lib/tenant-context";
import { tenantWhere } from "@/lib/tenant";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

// Token-gated printable report card (browser "Save as PDF").
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    const v = verifyPortalToken(token);
    if (!v.ok) return fail("Session expired.", 401);

    const student = await prisma.student.findUnique({ where: { id: v.studentId }, include: { class: true, section: true } });
    if (!student) return fail("Student not found.", 404);

    return runWithTenant({ schoolId: student.schoolId }, async () => {
      const results = await prisma.result.findMany({ where: { studentId: v.studentId }, include: { exam: true, subject: true }, orderBy: { createdAt: "desc" } });

      const latestExam = (results[0] as { exam?: { name: string } | null } | undefined)?.exam?.name;
      const examResults = results.filter((r: { exam?: { name: string } | null }) => r.exam?.name === latestExam);
      const subjects = examResults.map((r: { marks: number; totalMarks: number }) => ({ percentage: (r.marks / (r.totalMarks || 100)) * 100 }));
      const g = subjects.length ? computeGpa(subjects) : null;

      const rows = examResults.map((r: { subject?: { name: string } | null; marks: number; totalMarks: number; grade: string | null }) =>
        `<tr><td>${esc(r.subject?.name ?? "—")}</td><td style="text-align:right">${r.marks}/${r.totalMarks}</td><td style="text-align:center">${esc(r.grade ?? "—")}</td></tr>`).join("");

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Report Card — ${esc(student.fullName)}</title>
<style>
  body{font-family:system-ui,Segoe UI,Arial,sans-serif;color:#1a1a1a;max-width:720px;margin:32px auto;padding:0 24px}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0f766e;padding-bottom:16px}
  .brand{font-size:22px;font-weight:800;color:#0f766e}.sub{color:#666;font-size:13px}
  .meta{margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:14px}
  .meta div span{color:#666}
  table{width:100%;border-collapse:collapse;margin-top:24px;font-size:14px}
  th,td{padding:9px 8px;border-bottom:1px solid #eee}th{text-align:left;color:#666;font-size:12px;text-transform:uppercase}
  .gpa{margin-top:20px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center}
  .gpa .v{font-size:26px;font-weight:800;color:#0f766e}
  .foot{margin-top:32px;color:#999;font-size:12px;text-align:center;border-top:1px solid #eee;padding-top:16px}
  @media print{body{margin:0}.noprint{display:none}}
  .btn{margin-top:20px;background:#0f766e;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer}
</style></head><body>
  <div class="head"><div><div class="brand">Greenwood International School</div><div class="sub">Academic Report Card</div></div>
  <div class="sub" style="text-align:right">${esc(latestExam ?? "Latest Assessment")}</div></div>
  <div class="meta">
    <div><span>Student:</span> <strong>${esc(student.fullName)}</strong></div>
    <div><span>Student ID:</span> ${esc(student.studentId)}</div>
    <div><span>Class:</span> ${esc(student.class?.name ?? "—")}${student.section ? ` (${esc(student.section.name)})` : ""}</div>
    <div><span>Roll:</span> ${esc(student.rollNumber ?? "—")}</div>
  </div>
  <table><thead><tr><th>Subject</th><th style="text-align:right">Marks</th><th style="text-align:center">Grade</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="3" style="text-align:center;color:#999">No results recorded</td></tr>'}</tbody></table>
  ${g ? `<div class="gpa"><span>GPA (${esc(latestExam ?? "")})</span><span class="v">${formatGpa(g.gpa)} · ${g.overallGrade}</span></div>` : ""}
  <div class="foot">Computer-generated report card. Generated ${new Date().toLocaleString("en-BD")}.</div>
  <div class="noprint" style="text-align:center"><button class="btn" onclick="window.print()">Print / Save as PDF</button></div>
</body></html>`;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    });
  } catch {
    return fail("Failed to generate report card", 500);
  }
}
