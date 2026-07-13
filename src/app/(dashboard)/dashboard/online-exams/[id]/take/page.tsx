"use client";
import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import { request } from "@/services/api-client";
import { studentsApi } from "@/services/resources";
import { uploadFile } from "@/lib/upload-client";

type Q = { index: number; questionLinkId: string; type: "MCQ" | "WRITTEN"; text: string; options?: string[]; marks: number };
type Attempt = {
  attemptId: string; status: string; remainingSeconds: number; durationMinutes: number; totalMarks: number;
  questions: Q[]; answers: { questionLinkId: string; selectedOption: number | null; writtenAnswer: string | null; attachmentUrl: string | null }[];
};

export default function TakeExamPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const examId = params.id;

  const [students, setStudents] = React.useState<{ id: string; fullName: string; studentId: string }[]>([]);
  const [studentId, setStudentId] = React.useState("");
  const [attempt, setAttempt] = React.useState<Attempt | null>(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => { studentsApi.list({ limit: 300 }).then((d) => setStudents(d.items.map((s) => ({ id: s.id, fullName: s.fullName, studentId: s.studentId })))).catch(() => {}); }, []);

  const start = async () => {
    if (!studentId) return;
    setBusy(true); setError("");
    try {
      const d = await request<Attempt>(`/api/online-exams/${examId}/start`, { method: "POST", body: JSON.stringify({ studentId }) });
      setAttempt(d);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  if (!attempt) {
    return (
      <div className="mx-auto max-w-md space-y-4 pt-8">
        <Link href="/dashboard/online-exams" className="text-sm text-muted-foreground hover:underline">← {t("oexam.title")}</Link>
        <h1 className="text-xl font-semibold">{t("oexam.takeExam")}</h1>
        <Field label={t("oexam.takeAs")} required>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger><SelectValue placeholder={t("nav.students")} /></SelectTrigger>
            <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.studentId})</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={start} disabled={!studentId || busy}>{busy ? "…" : t("oexam.start")}</Button>
      </div>
    );
  }
  return <ExamRunner examId={examId} initial={attempt} onExit={() => setAttempt(null)} />;
}

function ExamRunner({ examId, initial, onExit }: { examId: string; initial: Attempt; onExit: () => void }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [answers, setAnswers] = React.useState<Record<string, { selectedOption: number | null; writtenAnswer: string; attachmentUrl: string }>>(
    () => Object.fromEntries(initial.answers.map((a) => [a.questionLinkId, { selectedOption: a.selectedOption, writtenAnswer: a.writtenAnswer ?? "", attachmentUrl: a.attachmentUrl ?? "" }]))
  );
  const [left, setLeft] = React.useState(initial.remainingSeconds);
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<any | null>(null);
  const [active, setActive] = React.useState(0);
  const savedRef = React.useRef<Record<string, number>>({});

  // Countdown timer. When it hits zero, auto-submit.
  React.useEffect(() => {
    if (result) return;
    const t = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) { clearInterval(t); doSubmit(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // Debounced autosave of the answer that just changed.
  const saveAnswer = React.useCallback((questionLinkId: string, patch: Partial<{ selectedOption: number | null; writtenAnswer: string; attachmentUrl: string }>) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionLinkId]: { ...prev[questionLinkId], ...patch } };
      return next;
    });
    // Debounce per question.
    if (savedRef.current[questionLinkId]) window.clearTimeout(savedRef.current[questionLinkId]);
    savedRef.current[questionLinkId] = window.setTimeout(async () => {
      const a = answers[questionLinkId];
      const merged = { ...a, ...patch };
      try {
        await request(`/api/online-exams/${examId}/answer`, { method: "POST", body: JSON.stringify({ attemptId: initial.attemptId, questionLinkId, ...merged }) });
      } catch { /* best-effort autosave */ }
    }, 800);
  }, [answers, examId, initial.attemptId]);

  const doSubmit = async (auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const d = await request<any>(`/api/online-exams/${examId}/submit`, { method: "POST", body: JSON.stringify({ attemptId: initial.attemptId, auto }) });
      setResult(d);
      toast({ variant: "success", title: t("oexam.examSubmitted") });
    } catch (e) { toast({ variant: "destructive", title: t("common.error"), description: (e as Error).message }); }
    finally { setSubmitting(false); }
  };

  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const low = left <= 30;

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 pt-6">
        <div className="rounded-xl border p-6 text-center">
          <div className="text-sm text-muted-foreground">{t("oexam.autoResult")}</div>
          <div className="mt-1 text-4xl font-bold">{result.score} <span className="text-lg text-muted-foreground">/ {result.totalMarks}</span></div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <Badge>{result.grade}</Badge>
            <span className="text-sm text-muted-foreground">{result.percentage.toFixed(1)}%</span>
            {result.rank != null && <Badge variant="secondary">{t("oexam.rank")} #{result.rank}</Badge>}
          </div>
          <div className="mt-4 flex justify-center gap-4 text-sm text-muted-foreground">
            <span>{t("oexam.correct")}: {result.correct}</span>
            <span>{t("oexam.wrong")}: {result.wrong}</span>
            <span>{t("oexam.unanswered")}: {result.unanswered}</span>
          </div>
          {result.pendingGrade && <div className="mt-2 text-xs text-amber-600">{t("oexam.pendingGrade")}</div>}
        </div>
        <div className="space-y-2">
          {result.answers.map((a: any, i: number) => (
            <div key={a.questionLinkId} className="rounded-lg border p-3 text-sm">
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{a.type === "MCQ" ? t("oexam.mcq") : t("oexam.written")}</Badge>
                <span className="font-medium">Q{i + 1}.</span>
              </div>
              <div className="text-muted-foreground">{a.text}</div>
              {a.type === "MCQ" ? (
                <div className="mt-1 text-xs">
                  {t("oexam.correct")}: {a.correctOption != null ? String.fromCharCode(65 + a.correctOption) : "—"} · {t("oexam.yourScore")}: {a.awardedMarks}
                  {a.isCorrect === false && a.selectedOption != null && <span className="ml-1 text-destructive">✗</span>}
                  {a.isCorrect === true && <span className="ml-1 text-green-600">✓</span>}
                </div>
              ) : (
                <div className="mt-1 text-xs text-muted-foreground">{t("oexam.yourScore")}: {a.awardedMarks}{a.gradedAt ? "" : ` (${t("oexam.pendingGrade")})`}</div>
              )}
            </div>
          ))}
        </div>
        <Button variant="outline" onClick={onExit}>{t("oexam.takeExam")}</Button>
      </div>
    );
  }

  const q = initial.questions[active];
  const a = answers[q.questionLinkId];

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg border bg-card/95 p-3 backdrop-blur">
        <div className="text-sm text-muted-foreground">{t("oexam.question")} {active + 1} {t("oexam.of")} {initial.questions.length}</div>
        <div className={`rounded-md px-3 py-1 font-mono text-sm font-semibold ${low ? "bg-destructive/10 text-destructive" : "bg-muted"}`}>
          {submitting ? t("oexam.autoSubmit") : `${t("oexam.timeLeft")}: ${mmss(left)}`}
        </div>
      </div>

      {/* Question navigator */}
      <div className="flex flex-wrap gap-1">
        {initial.questions.map((qq, i) => {
          const ans = answers[qq.questionLinkId];
          const done = qq.type === "MCQ" ? ans?.selectedOption != null : !!(ans?.writtenAnswer?.trim() || ans?.attachmentUrl);
          return (
            <button key={qq.questionLinkId} onClick={() => setActive(i)}
              className={`h-7 w-7 rounded text-xs ${i === active ? "bg-primary text-primary-foreground" : done ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border p-5">
        <div className="mb-3 flex items-center justify-between">
          <Badge variant={q.type === "MCQ" ? "default" : "secondary"}>{q.type === "MCQ" ? t("oexam.mcq") : t("oexam.written")}</Badge>
          <span className="text-xs text-muted-foreground">{q.marks} {t("oexam.marks")}</span>
        </div>
        <p className="mb-4 font-medium">{q.text}</p>
        {q.type === "MCQ" && q.options ? (
          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <label key={i} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition ${a?.selectedOption === i ? "border-primary bg-primary/5" : "hover:bg-accent"}`}>
                <input type="radio" name={q.questionLinkId} checked={a?.selectedOption === i} onChange={() => saveAnswer(q.questionLinkId, { selectedOption: i })} />
                <span className="font-semibold">{String.fromCharCode(65 + i)}.</span> {opt}
              </label>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea rows={5} value={a?.writtenAnswer ?? ""} onChange={(e) => saveAnswer(q.questionLinkId, { writtenAnswer: e.target.value })} placeholder={t("oexam.written")} />
            <AnswerFileUpload value={a?.attachmentUrl ?? ""} onChange={(url) => saveAnswer(q.questionLinkId, { attachmentUrl: url })} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={active === 0} onClick={() => setActive((i) => i - 1)}>←</Button>
        {active < initial.questions.length - 1 ? (
          <Button onClick={() => setActive((i) => i + 1)}>{t("oexam.question")} {active + 2} →</Button>
        ) : (
          <Button onClick={() => { if (confirm(t("oexam.confirmSubmit"))) doSubmit(false); }} disabled={submitting}>{t("oexam.submit")}</Button>
        )}
      </div>
    </div>
  );
}

function AnswerFileUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);
  return (
    <div className="flex items-center gap-2">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
        {busy ? "…" : t("hw.uploadFile")}
        <input type="file" className="hidden" disabled={busy} onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return;
          try { setBusy(true); onChange(await uploadFile(f)); } catch (err) { toast({ variant: "destructive", title: "Error", description: (err as Error).message }); } finally { setBusy(false); }
        }} />
      </label>
      {value && <a href={value} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">file</a>}
    </div>
  );
}
