"use client";
import * as React from "react";
import { Save, Award, FileText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/form-field";
import { examsApi, subjectsApi, studentsApi } from "@/services/resources";
import { request } from "@/services/api-client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import { gradeForPercentage } from "@/lib/grading";
import type { Exam, SubjectWithRelations, StudentWithRelations } from "@/types";

const gradeFor = gradeForPercentage;
const gradeVariant = (g: string) => (g === "F" ? "destructive" : g.startsWith("A") ? "success" : "secondary");

export default function ResultsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [subjects, setSubjects] = React.useState<SubjectWithRelations[]>([]);
  const [students, setStudents] = React.useState<StudentWithRelations[]>([]);
  const [examId, setExamId] = React.useState("");
  const [subjectId, setSubjectId] = React.useState("");
  const [totalMarks, setTotalMarks] = React.useState(100);
  const [scores, setScores] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    examsApi.list({ limit: 100 }).then((d) => setExams(d.items)).catch(() => {});
    subjectsApi.list({ limit: 100 }).then((d) => setSubjects(d.items)).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (!examId) return;
    setLoading(true);
    const exam = exams.find((e) => e.id === examId);
    studentsApi.list({ limit: 100 })
      .then((d) => {
        const filtered = exam?.classId ? d.items.filter((s) => s.classId === exam.classId) : d.items;
        setStudents(filtered);
        setScores({});
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [examId, exams]);

  const canEnter = examId && subjectId;

  const save = async () => {
    setSaving(true);
    try {
      const entries = students
        .filter((s) => scores[s.id] !== undefined && scores[s.id] !== "")
        .map((s) => ({ studentId: s.id, examId, subjectId, marks: Number(scores[s.id]), totalMarks }));
      if (entries.length === 0) { toast({ title: "Nothing to save", description: "Enter at least one mark." }); setSaving(false); return; }
      await Promise.all(entries.map((e) => request("/api/results", { method: "POST", body: JSON.stringify(e) })));
      toast({ variant: "success", title: "Results saved", description: `${entries.length} result(s) recorded` });
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title={t("page.results.title")}
        description={t("page.results.desc")}
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href="/dashboard/results/marksheet"><FileText className="h-4 w-4" /> Marksheet</a>
            </Button>
            <Button onClick={save} disabled={saving || !canEnter}><Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Results"}</Button>
          </div>
        }
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Field label="Exam">
          <Select value={examId} onValueChange={setExamId}>
            <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
            <SelectContent>{exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Subject">
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
            <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Total Marks">
          <Input type="number" min={1} value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value) || 100)} />
        </Field>
      </div>

      <Card>
        <CardContent className="p-0">
          {!canEnter ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <Award className="h-8 w-8" /><span>Select an exam and subject to enter marks</span>
            </div>
          ) : loading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">No students found for this exam</div>
          ) : (
            <ul className="divide-y">
              {students.map((s) => {
                const val = scores[s.id];
                const pct = val !== undefined && val !== "" ? (Number(val) / totalMarks) * 100 : null;
                return (
                  <li key={s.id} className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <div className="font-medium">{s.fullName}</div>
                      <div className="text-xs text-muted-foreground">{s.studentId}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {pct !== null && <Badge variant={gradeVariant(gradeFor(pct))}>{gradeFor(pct)} · {pct.toFixed(0)}%</Badge>}
                      <Input
                        type="number" min={0} max={totalMarks}
                        className="w-24" placeholder="Marks"
                        value={val ?? ""}
                        onChange={(e) => setScores((sc) => ({ ...sc, [s.id]: e.target.value }))}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
