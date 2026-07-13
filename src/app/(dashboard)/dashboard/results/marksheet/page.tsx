"use client";
import * as React from "react";
import { Printer, FileText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/form-field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { examsApi, studentsApi } from "@/services/resources";
import { request } from "@/services/api-client";
import { useI18n } from "@/components/i18n-provider";
import { computeGpa, formatGpa, pointForGrade, GRADE_BANDS, type SubjectResult } from "@/lib/grading";
import { Transcript, type TranscriptRow } from "@/components/dashboard/transcript";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Exam, StudentWithRelations } from "@/types";

type ResultRow = {
  id: string;
  marks: number;
  totalMarks: number;
  grade: string;
  subject?: { name: string; code: string } | null;
  student?: { id: string; fullName: string; studentId: string } | null;
  exam?: { name: string } | null;
};

const gradeVariant = (g: string) => (g === "F" ? "destructive" : g.startsWith("A") ? "success" : "secondary");

export default function MarksheetPage() {
  const { t, num, locale } = useI18n();
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [students, setStudents] = React.useState<StudentWithRelations[]>([]);
  const [examId, setExamId] = React.useState("");
  const [studentId, setStudentId] = React.useState("");
  const [rows, setRows] = React.useState<ResultRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [view, setView] = React.useState<"marksheet" | "transcript">("transcript");
  const [gradeView, setGradeViewState] = React.useState<"gpa" | "percentage">("gpa");

  React.useEffect(() => {
    examsApi.list({ limit: 100 }).then((d) => setExams(d.items)).catch(() => {});
    studentsApi.list({ limit: 100 }).then((d) => setStudents(d.items)).catch(() => {});
  }, []);

  // Restore saved grade-view preference (consistent with the locale toggle).
  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem("sms.gradeView");
      if (saved === "gpa" || saved === "percentage") setGradeViewState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setGradeView = React.useCallback((g: "gpa" | "percentage") => {
    setGradeViewState(g);
    try {
      window.localStorage.setItem("sms.gradeView", g);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    if (!examId || !studentId) {
      setRows([]);
      return;
    }
    setLoading(true);
    request<{ items: ResultRow[] }>(`/api/results?examId=${examId}&studentId=${studentId}`)
      .then((d) => setRows(d.items))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [examId, studentId]);

  const student = students.find((s) => s.id === studentId);
  const exam = exams.find((e) => e.id === examId);

  const subjectResults: SubjectResult[] = rows.map((r) => ({
    percentage: (r.marks / (r.totalMarks || 100)) * 100,
  }));
  const summary = computeGpa(subjectResults);
  // Average percentage across subjects — the headline metric in "percentage" view.
  const avgPct = subjectResults.length
    ? Math.round(subjectResults.reduce((s, r) => s + r.percentage, 0) / subjectResults.length)
    : 0;

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title={t("marksheet.reportCard")}
          description={t("marksheet.desc")}
          action={
            <Button onClick={() => window.print()} disabled={rows.length === 0}>
              <Printer className="h-4 w-4" /> {t("marksheet.print")}
            </Button>
          }
        />

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Field label={t("marksheet.exam")}>
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger><SelectValue placeholder={t("marksheet.selectExam")} /></SelectTrigger>
              <SelectContent>
                {exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("marksheet.student")}>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder={t("marksheet.selectStudent")} /></SelectTrigger>
              <SelectContent>
                {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as "marksheet" | "transcript")}>
          <TabsList>
            <TabsTrigger value="transcript">{t("transcript.viewTranscript")}</TabsTrigger>
            <TabsTrigger value="marksheet">{t("transcript.viewMarksheet")}</TabsTrigger>
          </TabsList>
        </Tabs>

        {view === "marksheet" && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{t("marksheet.viewMode")}:</span>
            <div className="inline-flex rounded-md border border-border p-0.5">
              <button
                type="button"
                onClick={() => setGradeView("gpa")}
                aria-pressed={gradeView === "gpa"}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${gradeView === "gpa" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
              >
                {t("marksheet.viewGpa")}
              </button>
              <button
                type="button"
                onClick={() => setGradeView("percentage")}
                aria-pressed={gradeView === "percentage"}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${gradeView === "percentage" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
              >
                {t("marksheet.viewPercentage")}
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : !examId || !studentId ? (
        <Card className="no-print">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <FileText className="h-8 w-8" />
            <span>{t("marksheet.selectExam")} · {t("marksheet.selectStudent")}</span>
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="no-print">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">{t("marksheet.noResults")}</CardContent>
        </Card>
      ) : view === "transcript" ? (
        <Transcript
          examName={exam?.name}
          rows={rows as TranscriptRow[]}
          student={{
            fullName: student?.fullName ?? "",
            studentId: student?.studentId ?? "",
            rollNumber: student?.rollNumber ?? null,
            className: student?.class?.name ?? null,
            sectionName: student?.section?.name ?? null,
            guardianName: student?.guardianName ?? null,
            dateOfBirth: student?.dateOfBirth ? String(student.dateOfBirth) : null,
            sessionName: null,
          }}
        />
      ) : (
        <Card className="print-area mx-auto max-w-3xl">
          <CardContent className="p-8">
            {/* Header */}
            <div className="mb-6 border-b border-border pb-4 text-center">
              <h2 className="text-xl font-bold tracking-tight">{t("app.name")}</h2>
              <p className="text-sm text-muted-foreground">{t("marksheet.title")}</p>
              <p className="mt-1 text-sm font-medium">{exam?.name}</p>
            </div>

            {/* Student info */}
            <div className="mb-6 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
              <div><span className="text-muted-foreground">{t("marksheet.student")}: </span><span className="font-medium">{student?.fullName}</span></div>
              <div><span className="text-muted-foreground">{t("marksheet.studentId")}: </span><span className="font-medium">{student?.studentId}</span></div>
              <div><span className="text-muted-foreground">{t("marksheet.roll")}: </span><span className="font-medium">{student?.rollNumber ? num(Number(student.rollNumber)) : "—"}</span></div>
              <div><span className="text-muted-foreground">{t("marksheet.class")}: </span><span className="font-medium">{student?.class?.name ?? "—"}</span></div>
              <div><span className="text-muted-foreground">{t("marksheet.section")}: </span><span className="font-medium">{student?.section?.name ?? "—"}</span></div>
            </div>

            {/* Marks table */}
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t("marksheet.subject")}</TableHead>
                  <TableHead className="text-right">{t("marksheet.marks")}</TableHead>
                  <TableHead className="text-right">{t("marksheet.total")}</TableHead>
                  {gradeView === "percentage" && (
                    <TableHead className="text-right">{t("marksheet.percentage")}</TableHead>
                  )}
                  <TableHead className="text-center">{t("marksheet.grade")}</TableHead>
                  {gradeView === "gpa" && (
                    <TableHead className="text-right">{t("marksheet.point")}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const pct = Math.round((r.marks / (r.totalMarks || 100)) * 100);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.subject?.name ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{num(r.marks)}</TableCell>
                      <TableCell className="text-right tabular-nums">{num(r.totalMarks)}</TableCell>
                      {gradeView === "percentage" && (
                        <TableCell className="text-right tabular-nums">{num(pct)}%</TableCell>
                      )}
                      <TableCell className="text-center"><Badge variant={gradeVariant(r.grade)}>{r.grade}</Badge></TableCell>
                      {gradeView === "gpa" && (
                        <TableCell className="text-right tabular-nums">{num(pointForGrade(r.grade))}</TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Summary */}
            <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-6 text-sm">
                {gradeView === "gpa" ? (
                  <div>
                    <span className="text-muted-foreground">{t("marksheet.gpa")}: </span>
                    <span className="text-lg font-bold tabular-nums">{locale === "bn" ? num(Number(formatGpa(summary.gpa))) : formatGpa(summary.gpa)}</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-muted-foreground">{t("marksheet.averagePct")}: </span>
                    <span className="text-lg font-bold tabular-nums">{num(avgPct)}%</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">{t("marksheet.grade")}: </span>
                  <Badge variant={gradeVariant(summary.overallGrade)}>{summary.overallGrade}</Badge>
                </div>
              </div>
              <Badge variant={summary.failed ? "destructive" : "success"} dot>
                {summary.failed ? t("marksheet.failed") : t("marksheet.passed")}
              </Badge>
            </div>

            {/* Grading scale reference */}
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("marksheet.gradingScale")}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {GRADE_BANDS.map((b) => (
                  <span key={b.grade} className="rounded-md border border-border px-2 py-1 tabular-nums">
                    {b.grade} · {num(b.point)} · {num(b.min)}+
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
