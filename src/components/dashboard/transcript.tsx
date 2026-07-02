"use client";
import * as React from "react";
import { GraduationCap } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { computeGpa, formatGpa, pointForGrade, GRADE_BANDS, type SubjectResult } from "@/lib/grading";

export type TranscriptRow = {
  id: string;
  marks: number;
  totalMarks: number;
  grade: string;
  subject?: { name: string; code: string } | null;
};

export type TranscriptStudent = {
  fullName: string;
  studentId: string;
  rollNumber?: string | null;
  className?: string | null;
  sectionName?: string | null;
  guardianName?: string | null;
  dateOfBirth?: string | null;
  sessionName?: string | null;
};

/**
 * A formal, print-ready Bangladesh-style academic transcript / report card.
 * Bilingual (labels via i18n) with Bangla numerals when the locale is "bn".
 */
export function Transcript({
  student, examName, rows,
}: {
  student: TranscriptStudent;
  examName?: string;
  rows: TranscriptRow[];
}) {
  const { t, num, date, locale } = useI18n();

  const subjectResults: SubjectResult[] = rows.map((r) => ({
    percentage: (r.marks / (r.totalMarks || 100)) * 100,
  }));
  const summary = computeGpa(subjectResults);
  const totalObtained = rows.reduce((s, r) => s + r.marks, 0);
  const totalFull = rows.reduce((s, r) => s + r.totalMarks, 0);
  const gpaText = locale === "bn" ? num(Number(formatGpa(summary.gpa))) : formatGpa(summary.gpa);

  return (
    <div className="print-area mx-auto max-w-3xl rounded-xl border border-border bg-card p-8">
      {/* Institution header */}
      <div className="flex flex-col items-center gap-1 border-b-2 border-foreground/80 pb-4 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="h-6 w-6" />
        </span>
        <h1 className="mt-1 text-xl font-bold tracking-tight">{t("app.name")}</h1>
        <p className="text-xs text-muted-foreground">123 Education Blvd, Mirpur, Dhaka-1216</p>
        <h2 className="mt-2 text-sm font-semibold uppercase tracking-wide">
          {t("transcript.heading")}{examName ? ` — ${examName}` : ""}
        </h2>
      </div>

      {/* Student particulars */}
      <dl className="mt-5 grid grid-cols-1 gap-x-10 gap-y-2 text-sm sm:grid-cols-2">
        <Particular label={t("transcript.name")} value={student.fullName} />
        <Particular label={t("marksheet.studentId")} value={student.studentId} mono />
        <Particular label={t("marksheet.class")} value={student.className ?? "—"} />
        <Particular label={t("marksheet.section")} value={student.sectionName ?? "—"} />
        <Particular label={t("marksheet.roll")} value={student.rollNumber ? num(Number(student.rollNumber)) : "—"} />
        <Particular label={t("transcript.session")} value={student.sessionName ?? "—"} />
        <Particular label={t("transcript.father")} value={student.guardianName ?? "—"} />
        <Particular label={t("transcript.dob")} value={student.dateOfBirth ? date(student.dateOfBirth) : "—"} />
      </dl>

      {/* Marks table */}
      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-y border-foreground/30 bg-muted/50 text-left">
            <th className="px-3 py-2 font-semibold">{t("transcript.serial")}</th>
            <th className="px-3 py-2 font-semibold">{t("marksheet.subject")}</th>
            <th className="px-3 py-2 text-right font-semibold">{t("transcript.fullMarks")}</th>
            <th className="px-3 py-2 text-right font-semibold">{t("transcript.obtained")}</th>
            <th className="px-3 py-2 text-center font-semibold">{t("marksheet.grade")}</th>
            <th className="px-3 py-2 text-right font-semibold">{t("marksheet.point")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-b border-border">
              <td className="px-3 py-2 tabular-nums">{num(i + 1)}</td>
              <td className="px-3 py-2 font-medium">{r.subject?.name ?? "—"}</td>
              <td className="px-3 py-2 text-right tabular-nums">{num(r.totalMarks)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{num(r.marks)}</td>
              <td className="px-3 py-2 text-center font-semibold">{r.grade}</td>
              <td className="px-3 py-2 text-right tabular-nums">{num(pointForGrade(r.grade))}</td>
            </tr>
          ))}
          <tr className="border-y border-foreground/30 bg-muted/40 font-semibold">
            <td className="px-3 py-2" colSpan={2}>{t("transcript.totalMarks")}</td>
            <td className="px-3 py-2 text-right tabular-nums">{num(totalFull)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{num(totalObtained)}</td>
            <td className="px-3 py-2" colSpan={2} />
          </tr>
        </tbody>
      </table>

      {/* Result summary */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-foreground/20 px-4 py-3">
        <div className="text-sm">
          <span className="text-muted-foreground">{t("transcript.gpaOutOf")}: </span>
          <span className="text-lg font-bold tabular-nums">{gpaText}</span>
          <span className="ml-3 text-muted-foreground">{t("marksheet.grade")}: </span>
          <span className="font-semibold">{summary.overallGrade}</span>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${summary.failed ? "bg-destructive/10 text-destructive" : "bg-success/12 text-success"}`}>
          {summary.failed ? t("marksheet.failed") : t("marksheet.passed")}
        </span>
      </div>

      {/* Grading scale */}
      <div className="mt-5">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("marksheet.gradingScale")}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          {GRADE_BANDS.map((b) => (
            <span key={b.grade} className="rounded border border-border px-2 py-0.5 tabular-nums">
              {b.grade} = {num(b.point)} ({num(b.min)}+)
            </span>
          ))}
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-12 grid grid-cols-3 gap-6 text-center text-xs">
        {[t("transcript.signGuardian"), t("transcript.signTeacher"), t("transcript.signHead")].map((label) => (
          <div key={label}>
            <div className="mx-auto border-t border-foreground/50 pt-1">{label}</div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">{t("transcript.controllerNote")}</p>
    </div>
  );
}

function Particular({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="min-w-[130px] text-muted-foreground">{label}:</span>
      <span className={mono ? "font-medium tabular-nums" : "font-medium"}>{value}</span>
    </div>
  );
}
