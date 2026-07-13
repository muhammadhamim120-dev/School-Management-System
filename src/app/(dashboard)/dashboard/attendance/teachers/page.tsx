"use client";
import * as React from "react";
import { Save } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import { request } from "@/services/api-client";
import { teachersApi } from "@/services/resources";
import { cn, initials, avatarUrl } from "@/lib/utils";
import type { Teacher, Paginated } from "@/types";

type AttStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
const STATUSES: AttStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];
const statusStyle: Record<AttStatus, string> = {
  PRESENT: "bg-emerald-500 text-white border-emerald-500",
  ABSENT: "bg-red-500 text-white border-red-500",
  LATE: "bg-amber-500 text-white border-amber-500",
  EXCUSED: "bg-blue-500 text-white border-blue-500",
};

export default function TeacherAttendancePage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [marks, setMarks] = React.useState<Record<string, AttStatus>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    teachersApi.list({ limit: 200 })
      .then((d: Paginated<Teacher>) => {
        setTeachers(d.items);
        const init: Record<string, AttStatus> = {};
        d.items.forEach((tc) => { init[tc.id] = "PRESENT"; });
        setMarks(init);
      })
      .catch(() => setTeachers([]))
      .finally(() => setLoading(false));
  }, []);

  const setStatus = (id: string, s: AttStatus) => setMarks((m) => ({ ...m, [id]: s }));

  const save = async () => {
    setSaving(true);
    try {
      const records = teachers.map((tc) => ({ teacherId: tc.id, date, status: marks[tc.id] ?? "PRESENT" }));
      await request("/api/teacher-attendance", { method: "POST", body: JSON.stringify({ records }) });
      toast({ variant: "success", title: t("common.save"), description: `${records.length} teacher record(s) for ${date}` });
    } catch (e) {
      toast({ variant: "destructive", title: t("common.error"), description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const summary = STATUSES.map((s) => ({ status: s, count: Object.values(marks).filter((m) => m === s).length }));

  return (
    <div>
      <PageHeader
        title={t("att.teachers")}
        description={t("page.attendance.desc")}
        action={
          <Button onClick={save} disabled={saving || teachers.length === 0}>
            <Save className="h-4 w-4" /> {saving ? t("common.saving") : t("common.save")}
          </Button>
        }
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t("field.date")}>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <div className="sm:col-span-3 flex flex-wrap items-end gap-2">
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
          ) : teachers.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">{t("common.noRecords")}</div>
          ) : (
            <ul className="divide-y">
              {teachers.map((tc) => (
                <li key={tc.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar><AvatarImage src={tc.photo || avatarUrl(tc.fullName)} /><AvatarFallback>{initials(tc.fullName)}</AvatarFallback></Avatar>
                    <div>
                      <div className="font-medium">{tc.fullName}</div>
                      <div className="text-xs text-muted-foreground">{tc.teacherId} · {tc.department ?? "—"}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatus(tc.id, st)}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                          marks[tc.id] === st ? statusStyle[st] : "hover:bg-accent"
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
