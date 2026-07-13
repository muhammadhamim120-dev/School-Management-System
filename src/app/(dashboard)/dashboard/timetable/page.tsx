"use client";
import * as React from "react";
import { Printer, Sparkles, Trash2, Plus, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/form-field";
import { request } from "@/services/api-client";
import { classesApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";
import type { Class, SubjectWithRelations, Teacher, Section, RoutineSlot } from "@/types";

// Client-side mirror of lib/timetable SHIFT_PERIODS (the lib imports Prisma so
// can't run in the browser). Must stay in sync with src/lib/timetable.ts.
const SHIFTS = ["MORNING", "DAY", "EVENING"] as const;
type Shift = (typeof SHIFTS)[number];
const PERIODS: Record<Shift, { start: string; end: string }[]> = {
  MORNING: [
    { start: "08:00", end: "08:45" }, { start: "08:45", end: "09:30" },
    { start: "09:45", end: "10:30" }, { start: "10:30", end: "11:15" }, { start: "11:15", end: "12:00" },
  ],
  DAY: [
    { start: "12:30", end: "13:15" }, { start: "13:15", end: "14:00" },
    { start: "14:15", end: "15:00" }, { start: "15:00", end: "15:45" }, { start: "15:45", end: "16:30" },
  ],
  EVENING: [
    { start: "16:30", end: "17:15" }, { start: "17:15", end: "18:00" },
    { start: "18:15", end: "19:00" }, { start: "19:00", end: "19:45" }, { start: "19:45", end: "20:30" },
  ],
};
const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"] as const;
const DAY_LABEL: Record<string, string> = { SUNDAY: "Sun", MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu" };

type SlotWithRelations = RoutineSlot & { subject?: { name: string } | null; teacher?: { fullName: string } | null };

export default function TimetablePage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [classId, setClassId] = React.useState("");
  const [shift, setShift] = React.useState<Shift>("MORNING");
  const [slots, setSlots] = React.useState<SlotWithRelations[]>([]);
  const [subjects, setSubjects] = React.useState<SubjectWithRelations[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);

  // Edit dialog state
  const [editing, setEditing] = React.useState<{ day: string; start: string; end: string; slot: SlotWithRelations | null } | null>(null);
  const [subjectId, setSubjectId] = React.useState("");
  const [teacherId, setTeacherId] = React.useState("");
  const [room, setRoom] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [conflict, setConflict] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    classesApi.list({ limit: 100 }).then((d) => setClasses(d.items)).catch(() => {});
    request<{ items: SubjectWithRelations[] }>("/api/subjects?limit=200").then((d) => setSubjects(d.items)).catch(() => {});
    request<{ items: Teacher[] }>("/api/teachers?limit=200").then((d) => setTeachers(d.items)).catch(() => {});
  }, []);

  const loadSlots = React.useCallback((cid: string) => {
    if (!cid) { setSlots([]); return; }
    setLoading(true);
    request<{ items: SlotWithRelations[] }>(`/api/routine-slots?classId=${cid}`)
      .then((d) => setSlots(d.items))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { loadSlots(classId); }, [classId, loadSlots]);

  const openCell = (day: string, period: { start: string; end: string }, slot: SlotWithRelations | null) => {
    setEditing({ day, start: period.start, end: period.end, slot });
    setSubjectId(slot?.subjectId ?? "");
    setTeacherId(slot?.teacherId ?? "");
    setRoom(slot?.room ?? "");
    setConflict(null);
  };

  const save = async () => {
    if (!editing || !classId) return;
    setSaving(true);
    setConflict(null);
    try {
      const payload = {
        classId,
        day: editing.day,
        startTime: editing.start,
        endTime: editing.end,
        subjectId: subjectId || null,
        teacherId: teacherId || null,
        room: room || null,
      };
      const res = await fetch(`/api/routine-slots${editing.slot ? `/${editing.slot.id}` : ""}`, {
        method: editing.slot ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.data?.conflicts?.length) {
          setConflict(json.data.conflicts.map((c: { detail: string }) => c.detail));
        } else {
          setConflict([json.error || "Could not save"]);
        }
        setSaving(false);
        return;
      }
      toast({ variant: "success", title: editing.slot ? t("common.update") : t("common.save") });
      setEditing(null);
      loadSlots(classId);
    } catch (e) {
      setConflict([(e as Error).message]);
    } finally {
      setSaving(false);
    }
  };

  const removeSlot = async () => {
    if (!editing?.slot) return;
    try {
      await request(`/api/routine-slots/${editing.slot.id}`, { method: "DELETE" });
      toast({ variant: "success", title: t("common.delete") });
      setEditing(null);
      loadSlots(classId);
    } catch (e) {
      toast({ variant: "destructive", title: t("common.error"), description: (e as Error).message });
    }
  };

  const generate = async () => {
    if (!classId) return;
    setGenerating(true);
    try {
      const result = await request<{ created: number; skipped: number; conflicts: string[] }>(
        "/api/routine-slots/generate",
        { method: "POST", body: JSON.stringify({ classId, shift }) }
      );
      toast({
        variant: result.created > 0 ? "success" : "destructive",
        title: t("tt.generatedOk"),
        description: `${t("tt.generated")}: ${result.created} · ${t("tt.skipped")}: ${result.skipped}`,
      });
      loadSlots(classId);
    } catch (e) {
      toast({ variant: "destructive", title: t("common.error"), description: (e as Error).message });
    } finally {
      setGenerating(false);
    }
  };

  const periods = PERIODS[shift];
  const cls = classes.find((c) => c.id === classId);

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title={t("tt.title")}
          description={t("tt.desc")}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => window.print()} disabled={!classId || slots.length === 0}>
                <Printer className="h-4 w-4" /> {t("tt.print")}
              </Button>
              <Button onClick={generate} disabled={generating || !classId}>
                <Sparkles className="h-4 w-4" /> {generating ? t("tt.generating") : t("tt.generate")}
              </Button>
            </div>
          }
        />

        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <Field label={t("field.class")}>
            <Select value={classId || "none"} onValueChange={(v) => { setClassId(v === "none" ? "" : v); const c = classes.find((x) => x.id === v); if (c?.shift) setShift((c.shift as Shift) ?? "MORNING"); }}>
              <SelectTrigger><SelectValue placeholder={t("opt.selectClass")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("tt.shift")}>
            <Select value={shift} onValueChange={(v) => setShift(v as Shift)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SHIFTS.map((s) => <SelectItem key={s} value={s}>{t(`shift.${s}`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      {!classId ? (
        <Card className="no-print"><CardContent className="py-16 text-center text-sm text-muted-foreground">{t("tt.selectClass")}</CardContent></Card>
      ) : loading ? (
        <Skeleton className="h-80 w-full rounded-xl" />
      ) : (
        <Card className="print-area">
          <CardContent className="p-4 sm:p-6">
            {/* Print header */}
            <div className="mb-4 hidden print:block">
              <h1 className="text-lg font-bold">{cls?.name ?? ""} — {t("tt.title")}</h1>
              <p className="text-xs text-muted-foreground">{t("tt.shift")}: {t(`shift.${shift}`)}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border border-border bg-muted/60 px-2 py-2 text-left font-semibold">{t("tt.period")}</th>
                    {DAYS.map((d) => (
                      <th key={d} className="border border-border bg-muted/60 px-2 py-2 text-center font-semibold">{DAY_LABEL[d]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map((p, pIdx) => (
                    <tr key={p.start}>
                      <td className="border border-border px-2 py-1.5 align-top">
                        <div className="font-medium">{t("tt.period")} {pIdx + 1}</div>
                        <div className="text-xs text-muted-foreground">{p.start}–{p.end}</div>
                      </td>
                      {DAYS.map((d) => {
                        const slot = slots.find((s) => s.day === d && s.startTime === p.start);
                        return (
                          <td key={d} className="border border-border p-0 align-top">
                            <button
                              onClick={() => openCell(d, p, slot ?? null)}
                              className={cn(
                                "flex h-full min-h-[64px] w-full flex-col items-start gap-0.5 px-2 py-1.5 text-left transition-colors hover:bg-accent/60",
                                !slot && "items-center justify-center text-muted-foreground"
                              )}
                            >
                              {slot ? (
                                <>
                                  <span className="font-medium">{slot.subject?.name ?? "—"}</span>
                                  <span className="text-xs text-muted-foreground">{slot.teacher?.fullName ?? ""}</span>
                                  {slot.room && <Badge variant="secondary" className="text-[10px]">{slot.room}</Badge>}
                                </>
                              ) : (
                                <Plus className="h-4 w-4 opacity-40" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-muted-foreground print:hidden">
              <Link href="/dashboard/subjects" className="underline">{t("page.subjects.title")}</Link> — {t("tt.desc")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add / edit slot dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.slot ? t("tt.editSlot") : t("tt.addSlot")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 text-sm">
              <div className="rounded-md bg-muted/50 px-3 py-2 text-muted-foreground">
                {DAY_LABEL[editing.day]} · {editing.start}–{editing.end}
              </div>
              <Field label={t("page.subjects.title")}>
                <Select value={subjectId || "none"} onValueChange={(v) => { setSubjectId(v === "none" ? "" : v); const sub = subjects.find((s) => s.id === v); if (sub?.teacherId) setTeacherId(sub.teacherId); }}>
                  <SelectTrigger><SelectValue placeholder={t("page.subjects.title")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("col.teacher")}>
                <Select value={teacherId || "none"} onValueChange={(v) => setTeacherId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder={t("opt.selectTeacher")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {teachers.map((tc) => <SelectItem key={tc.id} value={tc.id}>{tc.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("tt.room")}><Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="101" /></Field>

              {conflict && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs">
                  <div className="mb-1 flex items-center gap-1.5 font-medium text-destructive"><AlertTriangle className="h-3.5 w-3.5" /> {t("tt.conflict")}</div>
                  <ul className="space-y-1 text-muted-foreground">{conflict.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {editing?.slot && <Button variant="ghost" className="mr-auto text-destructive" onClick={removeSlot}><Trash2 className="h-4 w-4" /> {t("common.delete")}</Button>}
            <Button variant="outline" onClick={() => setEditing(null)}>{t("common.cancel")}</Button>
            <Button onClick={save} disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
