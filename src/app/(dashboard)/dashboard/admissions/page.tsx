"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ClipboardCheck, FolderOpen, Users, Armchair, Trophy, Award } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/form-field";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useResourceList } from "@/hooks/use-resource-list";
import { request } from "@/services/api-client";
import {
  admissionSessionSchema, applicationSchema,
  type AdmissionSessionInput, type ApplicationInput,
} from "@/lib/validations";
import { admissionSessionsApi, applicationsApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages";
import type { SessionWithCount, ApplicationWithSession } from "@/types";

const APP_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "ADMITTED", "REJECTED", "WAITLISTED"] as const;
const statusVariant = (s: string) =>
  s === "ADMITTED" ? "success" : s === "REJECTED" ? "destructive" : s === "SHORTLISTED" ? "default"
  : s === "WAITLISTED" ? "warning" : s === "UNDER_REVIEW" ? "default" : "secondary";

type Summary = {
  sessions: number; openSessions: number; totalApplications: number; totalSeats: number;
  statusBreakdown: { status: string; count: number }[];
};

export default function AdmissionsPage() {
  const { t, num } = useI18n();
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const load = React.useCallback(() => {
    setLoading(true);
    request<Summary>("/api/admissions-summary").then(setSummary).catch(() => setSummary(null)).finally(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const kpis = summary ? [
    { icon: FolderOpen, label: t("adm.totalSessions"), value: num(summary.sessions) },
    { icon: ClipboardCheck, label: t("adm.openSessions"), value: num(summary.openSessions) },
    { icon: Users, label: t("adm.totalApplications"), value: num(summary.totalApplications) },
    { icon: Armchair, label: t("adm.totalSeats"), value: num(summary.totalSeats) },
  ] : [];

  return (
    <div>
      <PageHeader title={t("adm.mTitle")} description={t("adm.mSubtitle")} />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => { const Icon = k.icon; return (
              <Card key={k.label}><CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                <div><div className="text-xl font-bold tabular-nums">{k.value}</div><div className="text-xs text-muted-foreground">{k.label}</div></div>
              </CardContent></Card>
            ); })}
          </div>
          {summary.statusBreakdown.length > 0 && (
            <Card className="mt-4">
              <CardHeader><CardTitle className="text-sm">{t("adm.statusBreakdown")}</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {summary.statusBreakdown.map((s) => (
                  <Badge key={s.status} variant={statusVariant(s.status)} dot>{t(`adm.st.${s.status}` as MessageKey)}: {num(s.count)}</Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : null}

      <div className="mt-6">
        <Tabs defaultValue="applications">
          <TabsList>
            <TabsTrigger value="applications">{t("adm.applications")}</TabsTrigger>
            <TabsTrigger value="sessions">{t("adm.sessions")}</TabsTrigger>
            <TabsTrigger value="merit">{t("adm.merit")}</TabsTrigger>
          </TabsList>
          <TabsContent value="applications" className="mt-4"><ApplicationsTab onChange={load} /></TabsContent>
          <TabsContent value="sessions" className="mt-4"><SessionsTab onChange={load} /></TabsContent>
          <TabsContent value="merit" className="mt-4"><MeritTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ---------------- Sessions ---------------- */
function SessionsTab({ onChange }: { onChange: () => void }) {
  const { t, num } = useI18n();
  const { toast } = useToast();
  const list = useResourceList<SessionWithCount>(admissionSessionsApi.list);
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<SessionWithCount | null>(null);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<AdmissionSessionInput>({ resolver: zodResolver(admissionSessionSchema), defaultValues: { year: new Date().getFullYear(), seats: 0, isOpen: true } });
  const openForm = () => { reset({ name: "", year: new Date().getFullYear(), seats: 0, isOpen: true }); setOpen(true); };
  const onSubmit = async (v: AdmissionSessionInput) => {
    try { await admissionSessionsApi.create(v); toast({ variant: "success", title: "Session created" }); setOpen(false); list.refresh(); onChange(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const del = async () => { if (!deleting) return;
    try { await admissionSessionsApi.remove(deleting.id); toast({ variant: "success", title: "Deleted" }); setDeleting(null); list.refresh(); onChange(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); } };
  const columns: Column<SessionWithCount>[] = [
    { key: "name", header: t("adm.name"), render: (s) => <span className="font-medium">{s.name}</span> },
    { key: "year", header: t("adm.year"), render: (s) => <span className="tabular-nums">{num(s.year)}</span> },
    { key: "classApplied", header: t("adm.classApplied"), render: (s) => s.classApplied ?? "—" },
    { key: "seats", header: t("adm.seats"), render: (s) => <span className="tabular-nums">{num(s.seats)}</span> },
    { key: "apps", header: t("adm.applications"), render: (s) => <span className="tabular-nums">{num(s._count?.applications ?? 0)}</span> },
    { key: "isOpen", header: t("adm.status"), render: (s) => <Badge variant={s.isOpen ? "success" : "secondary"} dot>{s.isOpen ? t("adm.open") : t("adm.closed")}</Badge> },
    { key: "actions", header: "", className: "text-right", render: (s) => (
      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(s)}><Trash2 className="h-4 w-4" /></Button>
    ) },
  ];
  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={openForm}><Plus className="h-4 w-4" /> {t("adm.newSession")}</Button></div>
      <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} total={list.total}
        page={list.page} totalPages={list.totalPages} search={list.search} onSearch={list.onSearch} onPage={list.setPage}
        onRetry={list.refresh} rowKey={(s) => s.id} searchPlaceholder="Search session…" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t("adm.newSession")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label={t("adm.name")} error={errors.name?.message} required><Input {...register("name")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("adm.year")} error={errors.year?.message} required><Input type="number" {...register("year")} /></Field>
            <Field label={t("adm.seats")} error={errors.seats?.message}><Input type="number" min={0} {...register("seats")} /></Field>
          </div>
          <Field label={t("adm.classApplied")}><Input {...register("classApplied")} /></Field>
          <Field label={t("adm.status")}>
            <Select value={watch("isOpen") ? "open" : "closed"} onValueChange={(v) => setValue("isOpen", v === "open")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="open">{t("adm.open")}</SelectItem><SelectItem value="closed">{t("adm.closed")}</SelectItem></SelectContent>
            </Select>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent></Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete session?" description={`Removes ${deleting?.name} and its applications.`} onConfirm={del} />
    </div>
  );
}

/* ---------------- Applications ---------------- */
function ApplicationsTab({ onChange }: { onChange: () => void }) {
  const { t, num } = useI18n();
  const { toast } = useToast();
  const list = useResourceList<ApplicationWithSession>(applicationsApi.list);
  const [sessions, setSessions] = React.useState<SessionWithCount[]>([]);
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<ApplicationWithSession | null>(null);
  React.useEffect(() => { admissionSessionsApi.list({ limit: 100 }).then((d) => setSessions(d.items)).catch(() => {}); }, []);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<ApplicationInput>({ resolver: zodResolver(applicationSchema), defaultValues: { status: "SUBMITTED", score: 0 } });
  const openForm = () => { reset({ sessionId: "", applicantName: "", status: "SUBMITTED", score: 0 }); setOpen(true); };
  const onSubmit = async (v: ApplicationInput) => {
    try { await applicationsApi.create(v); toast({ variant: "success", title: "Application added" }); setOpen(false); list.refresh(); onChange(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const changeStatus = async (a: ApplicationWithSession, status: string) => {
    try { await applicationsApi.update(a.id, { status } as Partial<ApplicationInput>); toast({ variant: "success", title: "Status updated" }); list.refresh(); onChange(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const del = async () => { if (!deleting) return;
    try { await applicationsApi.remove(deleting.id); toast({ variant: "success", title: "Deleted" }); setDeleting(null); list.refresh(); onChange(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); } };
  const columns: Column<ApplicationWithSession>[] = [
    { key: "applicantName", header: t("adm.applicant"), sortField: "applicantName", render: (a) => (
      <div><div className="font-medium">{a.applicantName}</div>{a.classApplied && <div className="text-xs text-muted-foreground">{a.classApplied}</div>}</div>
    ) },
    { key: "session", header: t("adm.session"), render: (a) => a.session?.name ?? "—" },
    { key: "guardian", header: t("adm.guardian"), render: (a) => a.guardianName ?? "—" },
    { key: "score", header: t("adm.score"), sortField: "score", render: (a) => <span className="tabular-nums">{num(a.score)}</span> },
    { key: "status", header: t("adm.status"), render: (a) => (
      <Select value={a.status} onValueChange={(v) => changeStatus(a, v)}>
        <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
        <SelectContent>{APP_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`adm.st.${s}` as MessageKey)}</SelectItem>)}</SelectContent>
      </Select>
    ) },
    { key: "actions", header: "", className: "text-right", render: (a) => (
      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(a)}><Trash2 className="h-4 w-4" /></Button>
    ) },
  ];
  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={openForm} disabled={sessions.length === 0}><Plus className="h-4 w-4" /> {t("adm.newApplication")}</Button></div>
      <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} total={list.total}
        page={list.page} totalPages={list.totalPages} search={list.search} onSearch={list.onSearch} onPage={list.setPage}
        sort={list.sort} onToggleSort={list.toggleSort}
        onRetry={list.refresh} rowKey={(a) => a.id} searchPlaceholder="Search applicant…"
        filters={
          <Select value={list.filters.sessionId ?? "all"} onValueChange={(v) => list.setFilter("sessionId", v === "all" ? undefined : v)}>
            <SelectTrigger className="h-9 w-48"><SelectValue placeholder={t("adm.session")} /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t("adm.session")}</SelectItem>{sessions.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        }
        activeFilterCount={list.activeFilterCount}
        onClearFilters={list.clearFilters}
      />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{t("adm.newApplication")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t("adm.session")} error={errors.sessionId?.message} required className="sm:col-span-2">
              <Select value={watch("sessionId")} onValueChange={(v) => setValue("sessionId", v)}>
                <SelectTrigger><SelectValue placeholder={t("adm.selectSession")} /></SelectTrigger>
                <SelectContent>{sessions.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label={t("adm.applicant")} error={errors.applicantName?.message} required><Input {...register("applicantName")} /></Field>
            <Field label={t("adm.classApplied")}><Input {...register("classApplied")} /></Field>
            <Field label={t("adm.guardian")}><Input {...register("guardianName")} /></Field>
            <Field label={t("adm.guardianPhone")}><Input {...register("guardianPhone")} /></Field>
            <Field label={t("adm.email")}><Input {...register("email")} /></Field>
            <Field label={t("adm.previousSchool")}><Input {...register("previousSchool")} /></Field>
            <Field label={t("adm.score")} error={errors.score?.message}><Input type="number" min={0} max={100} {...register("score")} /></Field>
            <Field label={t("adm.status")}>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v as ApplicationInput["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{APP_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`adm.st.${s}` as MessageKey)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent></Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete application?" description={`Removes ${deleting?.applicantName}.`} onConfirm={del} />
    </div>
  );
}

/* ---------------- Merit List ---------------- */
type MeritRow = { rank: number; id: string; applicantName: string; score: number; status: string; withinSeats: boolean };
function MeritTab() {
  const { t, num } = useI18n();
  const [sessions, setSessions] = React.useState<SessionWithCount[]>([]);
  const [sessionId, setSessionId] = React.useState("");
  const [data, setData] = React.useState<{ seats: number; list: MeritRow[] } | null>(null);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => { admissionSessionsApi.list({ limit: 100 }).then((d) => { setSessions(d.items); if (d.items[0]) setSessionId(d.items[0].id); }).catch(() => {}); }, []);
  React.useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    request<{ seats: number; list: MeritRow[] }>(`/api/admission-sessions/${sessionId}/merit`).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [sessionId]);
  return (
    <div>
      <div className="mb-4 max-w-xs">
        <Select value={sessionId} onValueChange={setSessionId}>
          <SelectTrigger><SelectValue placeholder={t("adm.selectSession")} /></SelectTrigger>
          <SelectContent>{sessions.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
      ) : !data || data.list.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">{t("adm.noApplications")}</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {data.list.map((r) => (
                <div key={r.id} className={`flex items-center justify-between px-4 py-3 ${r.withinSeats ? "bg-success/5" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums">
                      {r.rank <= 3 ? <Trophy className="h-4 w-4 text-warning" /> : num(r.rank)}
                    </div>
                    <div>
                      <div className="font-medium">{r.applicantName}</div>
                      <div className="text-xs text-muted-foreground">{t("adm.score")}: {num(r.score)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.withinSeats && data.seats > 0 && <Badge variant="success" dot><Award className="mr-1 h-3 w-3" /> {t("adm.withinSeats")}</Badge>}
                    <Badge variant={statusVariant(r.status)} dot>{t(`adm.st.${r.status}` as MessageKey)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
