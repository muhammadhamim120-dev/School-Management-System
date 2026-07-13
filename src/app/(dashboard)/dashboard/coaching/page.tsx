"use client";
import * as React from "react";
import { Plus, Pencil, Trash2, Users, GraduationCap, Wallet, BarChart3, UserPlus, Save } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/form-field";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { request } from "@/services/api-client";
import { studentsApi, subjectsApi, teachersApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";
import type { StudentWithRelations, SubjectWithRelations, Teacher } from "@/types";

type Batch = {
  id: string; name: string; subjectId?: string | null; teacherId?: string | null;
  capacity: number; monthlyFee: number; room?: string | null; schedule?: string | null;
  status: string; subject?: { name: string } | null; teacher?: { fullName: string } | null;
  _count?: { enrollments: number };
};

type Enrollment = { id: string; status: string; enrolledAt: string; student: { id: string; fullName: string; studentId: string; class?: { name: string } | null } };

type BatchDetail = Batch & { enrollments: Enrollment[] };

type AttRow = { enrollmentId: string; studentId: string; name: string; status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | null };
type ReportData = {
  enrollment: { active: number; total: number; capacity: number };
  attendance: { rate: number | null; records: number };
  fees: { invoiced: number; collected: number; outstanding: number; invoiceCount: number };
};

type AttStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
const STATUSES: AttStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];
const statusStyle: Record<AttStatus, string> = {
  PRESENT: "bg-emerald-500 text-white border-emerald-500",
  ABSENT: "bg-red-500 text-white border-red-500",
  LATE: "bg-amber-500 text-white border-amber-500",
  EXCUSED: "bg-blue-500 text-white border-blue-500",
};

export default function CoachingPage() {
  const { t, num, money } = useI18n();
  const { toast } = useToast();
  const [batches, setBatches] = React.useState<Batch[]>([]);
  const [subjects, setSubjects] = React.useState<SubjectWithRelations[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Batch | null>(null);
  const [deleting, setDeleting] = React.useState<Batch | null>(null);

  // Detail dialog
  const [detail, setDetail] = React.useState<BatchDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  // Form state
  const [fName, setFName] = React.useState("");
  const [fSubject, setFSubject] = React.useState("");
  const [fTeacher, setFTeacher] = React.useState("");
  const [fCapacity, setFCapacity] = React.useState("30");
  const [fFee, setFFee] = React.useState("0");
  const [fRoom, setFRoom] = React.useState("");
  const [fSchedule, setFSchedule] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    request<{ items: Batch[] }>("/api/coaching-batches?limit=200").then((d) => setBatches(d.items)).catch(() => setBatches([])).finally(() => setLoading(false));
  }, []);
  React.useEffect(() => {
    load();
    subjectsApi.list({ limit: 200 }).then((d) => setSubjects(d.items)).catch(() => {});
    teachersApi.list({ limit: 200 }).then((d) => setTeachers(d.items)).catch(() => {});
  }, [load]);

  const openForm = (b?: Batch) => {
    setEditing(b ?? null);
    setFName(b?.name ?? ""); setFSubject(b?.subjectId ?? ""); setFTeacher(b?.teacherId ?? "");
    setFCapacity(String(b?.capacity ?? 30)); setFFee(String(b?.monthlyFee ?? 0));
    setFRoom(b?.room ?? ""); setFSchedule(b?.schedule ?? "");
    setFormOpen(true);
  };

  const save = async () => {
    if (!fName.trim()) { toast({ variant: "destructive", title: t("coach.batchName") }); return; }
    setSaving(true);
    try {
      const payload = {
        name: fName, subjectId: fSubject || undefined, teacherId: fTeacher || undefined,
        capacity: Number(fCapacity) || 30, monthlyFee: Number(fFee) || 0,
        room: fRoom || undefined, schedule: fSchedule || undefined,
      };
      if (editing) await request(`/api/coaching-batches/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await request("/api/coaching-batches", { method: "POST", body: JSON.stringify(payload) });
      toast({ variant: "success", title: editing ? t("common.update") : t("coach.newBatch") });
      setFormOpen(false); load();
    } catch (e) { toast({ variant: "destructive", title: t("common.error"), description: (e as Error).message }); }
    finally { setSaving(false); }
  };

  const openDetail = async (b: Batch) => {
    setDetailLoading(true); setDetail(null);
    try {
      const d = await request<BatchDetail>(`/api/coaching-batches/${b.id}`);
      setDetail(d);
    } catch { setDetail(b as BatchDetail); } finally { setDetailLoading(false); }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try { await request(`/api/coaching-batches/${deleting.id}`, { method: "DELETE" }); toast({ variant: "success", title: t("common.delete") }); setDeleting(null); load(); }
    catch (e) { toast({ variant: "destructive", title: t("common.error"), description: (e as Error).message }); }
  };

  return (
    <div>
      <PageHeader title={t("coach.title")} description={t("coach.desc")}
        action={<Button onClick={() => openForm()}><Plus className="h-4 w-4" /> {t("coach.newBatch")}</Button>}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : batches.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">{t("common.noRecords")}</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((b) => (
            <Card key={b.id} className="lift cursor-pointer" onClick={() => openDetail(b)}>
              <CardContent className="p-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{b.name}</div>
                    <div className="text-xs text-muted-foreground">{b.subject?.name ?? "—"} · {b.teacher?.fullName ?? "—"}</div>
                  </div>
                  <Badge variant={b.status === "ACTIVE" ? "success" : "secondary"}>{b.status === "ACTIVE" ? t("coach.active") : t("coach.closed")}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-3.5 w-3.5" /> {num(b._count?.enrollments ?? 0)}/{num(b.capacity)}</span>
                  <span className="font-medium tabular-nums">{money(b.monthlyFee)}</span>
                </div>
                {b.schedule && <div className="mt-2 truncate text-xs text-muted-foreground">{b.schedule}</div>}
                <div className="mt-3 flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" onClick={() => openForm(b)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(b)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / edit batch */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? t("coach.editBatch") : t("coach.newBatch")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("coach.batchName")} required className="col-span-2"><Input value={fName} onChange={(e) => setFName(e.target.value)} /></Field>
            <Field label={t("page.subjects.title")}>
              <Select value={fSubject || "none"} onValueChange={(v) => setFSubject(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">—</SelectItem>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label={t("col.teacher")}>
              <Select value={fTeacher || "none"} onValueChange={(v) => setFTeacher(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">—</SelectItem>{teachers.map((tc) => <SelectItem key={tc.id} value={tc.id}>{tc.fullName}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label={t("coach.capacity")}><Input type="number" min={1} value={fCapacity} onChange={(e) => setFCapacity(e.target.value)} /></Field>
            <Field label={t("coach.monthlyFee")}><Input type="number" min={0} value={fFee} onChange={(e) => setFFee(e.target.value)} /></Field>
            <Field label={t("coach.room")}><Input value={fRoom} onChange={(e) => setFRoom(e.target.value)} /></Field>
            <Field label={t("coach.schedule")}><Input value={fSchedule} onChange={(e) => setFSchedule(e.target.value)} placeholder="Sun/Tue/Thu 16:30" /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={save} disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch detail with tabs */}
      <Dialog open={!!detail || detailLoading} onOpenChange={(o) => { if (!o) { setDetail(null); setDetailLoading(false); } }}>
        <DialogContent className="max-w-3xl">
          {detailLoading ? (
            <div className="space-y-2 py-8">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : detail ? (
            <>
              <DialogHeader><DialogTitle>{detail.name}</DialogTitle></DialogHeader>
              <Tabs defaultValue="enrollment">
                <TabsList>
                  <TabsTrigger value="enrollment"><Users className="h-3.5 w-3.5" /> {t("coach.enrollment")}</TabsTrigger>
                  <TabsTrigger value="attendance"><GraduationCap className="h-3.5 w-3.5" /> {t("nav.attendance")}</TabsTrigger>
                  <TabsTrigger value="fees"><Wallet className="h-3.5 w-3.5" /> {t("nav.fees")}</TabsTrigger>
                  <TabsTrigger value="report"><BarChart3 className="h-3.5 w-3.5" /> {t("coach.report")}</TabsTrigger>
                </TabsList>
                <TabsContent value="enrollment" className="mt-4"><EnrollmentTab batch={detail} onChanged={() => openDetail(detail)} /></TabsContent>
                <TabsContent value="attendance" className="mt-4"><AttendanceTab batch={detail} /></TabsContent>
                <TabsContent value="fees" className="mt-4"><FeesTab batch={detail} /></TabsContent>
                <TabsContent value="report" className="mt-4"><ReportTab batch={detail} /></TabsContent>
              </Tabs>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title={t("common.delete")} onConfirm={confirmDelete} />
    </div>
  );
}

// ─── Enrollment tab ─────────────────────────────────────────────────────────
function EnrollmentTab({ batch, onChanged }: { batch: BatchDetail; onChanged: () => void }) {
  const { t, num } = useI18n();
  const { toast } = useToast();
  const [allStudents, setAllStudents] = React.useState<StudentWithRelations[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [picking, setPicking] = React.useState(false);

  React.useEffect(() => {
    studentsApi.list({ limit: 300 }).then((d) => setAllStudents(d.items)).catch(() => {});
  }, []);

  const enrolledIds = new Set(batch.enrollments.map((e) => e.student.id));
  const available = allStudents.filter((s) => !enrolledIds.has(s.id));

  const toggle = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const enroll = async () => {
    if (selected.size === 0) return;
    try {
      const res = await request<{ created: number }>(`/api/coaching-batches/${batch.id}/enroll`, { method: "POST", body: JSON.stringify({ studentIds: [...selected] }) });
      toast({ variant: "success", title: t("coach.enrolled"), description: `${num(res.created)}` });
      setSelected(new Set()); setPicking(false); onChanged();
    } catch (e) { toast({ variant: "destructive", title: t("common.error"), description: (e as Error).message }); }
  };

  const drop = async (studentId: string) => {
    try { await request(`/api/coaching-batches/${batch.id}/enroll?studentId=${studentId}`, { method: "DELETE" }); onChanged(); }
    catch (e) { toast({ variant: "destructive", title: t("common.error"), description: (e as Error).message }); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{num(batch.enrollments.length)} / {num(batch.capacity)}</span>
        <Button size="sm" variant="outline" onClick={() => setPicking((p) => !p)}><UserPlus className="h-4 w-4" /> {t("coach.enrollStudents")}</Button>
      </div>
      {picking && (
        <div className="rounded-lg border p-3">
          {available.length === 0 ? <p className="py-3 text-center text-xs text-muted-foreground">{t("common.noRecords")}</p> : (
            <>
              <div className="mb-2 max-h-48 overflow-auto">
                <div className="flex flex-wrap gap-1.5">
                  {available.map((s) => (
                    <button key={s.id} type="button" onClick={() => toggle(s.id)}
                      className={cn("rounded-full border px-2.5 py-1 text-xs", selected.has(s.id) ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent")}>
                      {s.fullName}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setPicking(false)}>{t("common.cancel")}</Button>
                <Button size="sm" onClick={enroll} disabled={selected.size === 0}>{t("coach.enrollStudents")} ({num(selected.size)})</Button>
              </div>
            </>
          )}
        </div>
      )}
      {batch.enrollments.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{t("coach.noStudents")}</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {batch.enrollments.map((e) => (
            <li key={e.id} className="flex items-center justify-between p-2.5 text-sm">
              <div><div className="font-medium">{e.student.fullName}</div><div className="text-xs text-muted-foreground">{e.student.studentId} · {e.student.class?.name ?? "—"}</div></div>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => drop(e.student.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Attendance tab ─────────────────────────────────────────────────────────
function AttendanceTab({ batch }: { batch: BatchDetail }) {
  const { t, num } = useI18n();
  const { toast } = useToast();
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = React.useState<AttRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback((d: string) => {
    setLoading(true);
    request<{ items: AttRow[] }>(`/api/coaching-batches/${batch.id}/attendance?date=${d}`)
      .then((r) => setRows(r.items)).catch(() => setRows([])).finally(() => setLoading(false));
  }, [batch.id]);
  React.useEffect(() => { load(date); }, [date, load]);

  const setStatus = (sid: string, s: AttStatus) => setRows((r) => r.map((x) => x.studentId === sid ? { ...x, status: s } : x));

  const save = async () => {
    setSaving(true);
    try {
      const records = rows.filter((r) => r.status).map((r) => ({ studentId: r.studentId, status: r.status }));
      await request(`/api/coaching-batches/${batch.id}/attendance`, { method: "POST", body: JSON.stringify({ date, records }) });
      toast({ variant: "success", title: t("common.save") });
    } catch (e) { toast({ variant: "destructive", title: t("common.error"), description: (e as Error).message }); }
    finally { setSaving(false); }
  };

  if (batch.enrollments.length === 0) return <p className="py-4 text-center text-sm text-muted-foreground">{t("coach.noStudents")}</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
        <Button size="sm" onClick={save} disabled={saving || loading}><Save className="h-4 w-4" /> {t("common.save")}</Button>
      </div>
      {loading ? <Skeleton className="h-32 w-full" /> : (
        <ul className="divide-y rounded-md border">
          {rows.map((r) => (
            <li key={r.studentId} className="flex items-center justify-between p-2.5 text-sm">
              <span className="font-medium">{r.name}</span>
              <div className="flex gap-1">
                {STATUSES.map((st) => (
                  <button key={st} onClick={() => setStatus(r.studentId, st)}
                    className={cn("rounded border px-2 py-1 text-xs font-medium", r.status === st ? statusStyle[st] : "hover:bg-accent")}>{st}</button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Fees tab ───────────────────────────────────────────────────────────────
function FeesTab({ batch }: { batch: BatchDetail }) {
  const { t, money, num } = useI18n();
  const { toast } = useToast();
  const [month, setMonth] = React.useState(new Date().toISOString().slice(0, 7));
  const [busy, setBusy] = React.useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      const res = await request<{ created: number; skipped: number }>(`/api/coaching-batches/${batch.id}/invoice`, { method: "POST", body: JSON.stringify({ month }) });
      toast({ variant: "success", title: t("coach.feesGenerated"), description: `${num(res.created)} · ${month}` });
    } catch (e) { toast({ variant: "destructive", title: t("common.error"), description: (e as Error).message }); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/40 p-3 text-sm">
        <div className="text-muted-foreground">{t("coach.monthlyFee")}</div>
        <div className="text-lg font-bold tabular-nums">{money(batch.monthlyFee)}</div>
      </div>
      <div className="flex items-end gap-2">
        <Field label={t("coach.monthlyFee")}><Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></Field>
        <Button onClick={generate} disabled={busy || batch.enrollments.length === 0}>{t("coach.generateFees")}</Button>
      </div>
      <p className="text-xs text-muted-foreground">{t("fin.subtitle")}</p>
    </div>
  );
}

// ─── Report tab ─────────────────────────────────────────────────────────────
function ReportTab({ batch }: { batch: BatchDetail }) {
  const { t, num, money } = useI18n();
  const [report, setReport] = React.useState<ReportData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    request<ReportData>(`/api/coaching-batches/${batch.id}/report`).then(setReport).catch(() => setReport(null)).finally(() => setLoading(false));
  }, [batch.id]);

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!report) return <p className="py-4 text-center text-sm text-muted-foreground">{t("common.noRecords")}</p>;

  const kpis = [
    { label: t("coach.enrolled"), value: `${num(report.enrollment.active)}/${num(report.enrollment.capacity)}` },
    { label: t("coach.attendanceRate"), value: report.attendance.rate != null ? `${num(report.attendance.rate)}%` : "—" },
    { label: t("coach.collected"), value: money(report.fees.collected) },
    { label: t("coach.outstanding"), value: money(report.fees.outstanding) },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((k) => (
        <div key={k.label} className="rounded-lg border p-3">
          <div className="text-xs text-muted-foreground">{k.label}</div>
          <div className="mt-1 text-lg font-bold tabular-nums">{k.value}</div>
        </div>
      ))}
    </div>
  );
}
