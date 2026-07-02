"use client";
import * as React from "react";
import { Save, CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/form-field";
import { studentsApi, classesApi } from "@/services/resources";
import { request } from "@/services/api-client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import { cn, initials, avatarUrl } from "@/lib/utils";
import type { StudentWithRelations, Class, Paginated } from "@/types";

type AttStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
const STATUSES: AttStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];
const statusStyle: Record<AttStatus, string> = {
  PRESENT: "bg-emerald-500 text-white border-emerald-500",
  ABSENT: "bg-red-500 text-white border-red-500",
  LATE: "bg-amber-500 text-white border-amber-500",
  EXCUSED: "bg-blue-500 text-white border-blue-500",
};

export default function AttendancePage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [classId, setClassId] = React.useState<string>("");
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [students, setStudents] = React.useState<StudentWithRelations[]>([]);
  const [marks, setMarks] = React.useState<Record<string, AttStatus>>({});
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    classesApi.list({ limit: 100 }).then((d) => setClasses(d.items)).catch(() => {});
  }, []);

  React.useEffect(() => {
    setLoading(true);
    studentsApi.list({ limit: 100 })
      .then((d: Paginated<StudentWithRelations>) => {
        const filtered = classId ? d.items.filter((s) => s.classId === classId) : d.items;
        setStudents(filtered);
        const init: Record<string, AttStatus> = {};
        filtered.forEach((s) => { init[s.id] = "PRESENT"; });
        setMarks(init);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [classId]);

  const setStatus = (id: string, s: AttStatus) => setMarks((m) => ({ ...m, [id]: s }));

  const save = async () => {
    setSaving(true);
    try {
      const records = students.map((s) => ({ studentId: s.id, date, status: marks[s.id] ?? "PRESENT" }));
      await request("/api/attendance", { method: "POST", body: JSON.stringify({ records }) });
      toast({ variant: "success", title: "Attendance saved", description: `${records.length} record(s) for ${date}` });
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
    finally { setSaving(false); }
  };

  const summary = STATUSES.map((s) => ({ status: s, count: Object.values(marks).filter((m) => m === s).length }));

  return (
    <div>
      <PageHeader
        title={t("page.attendance.title")}
        description={t("page.attendance.desc")}
        action={
          <Button onClick={save} disabled={saving || students.length === 0}>
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Attendance"}
          </Button>
        }
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t("field.date")}>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={t("field.class")}>
          <Select value={classId || "all"} onValueChange={(v) => setClassId(v === "all" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder={t("opt.allClasses")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <div className="sm:col-span-2 flex flex-wrap items-end gap-2">
          {summary.map((s) => (
            <span key={s.status} className={cn("rounded-md px-3 py-1.5 text-xs font-medium", statusStyle[s.status])}>
              {s.status}: {s.count}
            </span>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <CalendarCheck className="h-8 w-8" /><span>No students found for this selection</span>
            </div>
          ) : (
            <ul className="divide-y">
              {students.map((s) => (
                <li key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar><AvatarImage src={s.photo || avatarUrl(s.fullName)} /><AvatarFallback>{initials(s.fullName)}</AvatarFallback></Avatar>
                    <div>
                      <div className="font-medium">{s.fullName}</div>
                      <div className="text-xs text-muted-foreground">{s.studentId} · {s.class?.name ?? "—"}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatus(s.id, st)}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                          marks[s.id] === st ? statusStyle[st] : "hover:bg-accent"
                        )}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
