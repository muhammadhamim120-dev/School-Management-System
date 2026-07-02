"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Building2, CalendarRange, Star } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/form-field";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { campusSchema, sessionSchema, type CampusInput, type SessionInput } from "@/lib/validations";
import { campusesApi, sessionsApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import { formatDate } from "@/lib/utils";
import type { Campus, SessionWithTerms } from "@/types";

type CampusRow = Campus & { _count?: { students: number; teachers: number; classes: number } };

function toDateInput(d?: Date | string | null) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export default function AcademicSetupPage() {
  const { toast } = useToast();
  const { t } = useI18n();

  // ---- Campuses ----
  const [campuses, setCampuses] = React.useState<CampusRow[]>([]);
  const [campusLoading, setCampusLoading] = React.useState(true);
  const [campusOpen, setCampusOpen] = React.useState(false);
  const [editingCampus, setEditingCampus] = React.useState<CampusRow | null>(null);
  const [deletingCampus, setDeletingCampus] = React.useState<CampusRow | null>(null);

  // ---- Sessions ----
  const [sessions, setSessions] = React.useState<SessionWithTerms[]>([]);
  const [sessionLoading, setSessionLoading] = React.useState(true);
  const [sessionOpen, setSessionOpen] = React.useState(false);
  const [editingSession, setEditingSession] = React.useState<SessionWithTerms | null>(null);
  const [deletingSession, setDeletingSession] = React.useState<SessionWithTerms | null>(null);

  const loadCampuses = React.useCallback(() => {
    setCampusLoading(true);
    campusesApi.list({ limit: 100 }).then((d) => setCampuses(d.items)).catch(() => setCampuses([])).finally(() => setCampusLoading(false));
  }, []);
  const loadSessions = React.useCallback(() => {
    setSessionLoading(true);
    sessionsApi.list({ limit: 100 }).then((d) => setSessions(d.items)).catch(() => setSessions([])).finally(() => setSessionLoading(false));
  }, []);
  React.useEffect(() => { loadCampuses(); loadSessions(); }, [loadCampuses, loadSessions]);

  const campusForm = useForm<CampusInput>({ resolver: zodResolver(campusSchema) });
  const sessionForm = useForm<SessionInput>({ resolver: zodResolver(sessionSchema) });

  const openCampus = (c?: CampusRow) => {
    setEditingCampus(c ?? null);
    campusForm.reset({ name: c?.name ?? "", code: c?.code ?? "", address: c?.address ?? "", phone: c?.phone ?? "", isMain: c?.isMain ?? false });
    setCampusOpen(true);
  };
  const openSession = (s?: SessionWithTerms) => {
    setEditingSession(s ?? null);
    sessionForm.reset({
      name: s?.name ?? "",
      startDate: (toDateInput(s?.startDate) as unknown as Date),
      endDate: (toDateInput(s?.endDate) as unknown as Date),
      isCurrent: s?.isCurrent ?? false,
    });
    setSessionOpen(true);
  };

  const submitCampus = async (values: CampusInput) => {
    try {
      if (editingCampus) await campusesApi.update(editingCampus.id, values);
      else await campusesApi.create(values);
      toast({ variant: "success", title: editingCampus ? "Campus updated" : "Campus created" });
      setCampusOpen(false); loadCampuses();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const submitSession = async (values: SessionInput) => {
    try {
      if (editingSession) await sessionsApi.update(editingSession.id, values);
      else await sessionsApi.create(values);
      toast({ variant: "success", title: editingSession ? "Session updated" : "Session created" });
      setSessionOpen(false); loadSessions();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const deleteCampus = async () => {
    if (!deletingCampus) return;
    try { await campusesApi.remove(deletingCampus.id); toast({ variant: "success", title: "Campus deleted" }); setDeletingCampus(null); loadCampuses(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const deleteSession = async () => {
    if (!deletingSession) return;
    try { await sessionsApi.remove(deletingSession.id); toast({ variant: "success", title: "Session deleted" }); setDeletingSession(null); loadSessions(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };

  return (
    <div>
      <PageHeader title={t("academic.title")} description={t("academic.subtitle")} />

      <Tabs defaultValue="campuses">
        <TabsList>
          <TabsTrigger value="campuses">{t("academic.campuses")}</TabsTrigger>
          <TabsTrigger value="sessions">{t("academic.sessionsTerms")}</TabsTrigger>
        </TabsList>

        {/* Campuses */}
        <TabsContent value="campuses" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => openCampus()}><Plus className="h-4 w-4" /> {t("academic.addCampus")}</Button>
          </div>
          {campusLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : campuses.length === 0 ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground">{t("academic.noCampuses")}</CardContent></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {campuses.map((c) => (
                <Card key={c.id}>
                  <CardHeader className="flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" /> {c.name}
                      </CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">{c.code}</p>
                    </div>
                    {c.isMain && <Badge variant="success" dot>{t("academic.main")}</Badge>}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">{c.address ?? "—"}</div>
                    <div className="flex gap-4 text-xs text-muted-foreground tabular-nums">
                      <span>{c._count?.students ?? 0} {t("academic.students")}</span>
                      <span>{c._count?.teachers ?? 0} {t("academic.teachers")}</span>
                      <span>{c._count?.classes ?? 0} {t("academic.classes")}</span>
                    </div>
                    <div className="flex gap-1 pt-1">
                      <Button variant="ghost" size="sm" onClick={() => openCampus(c)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeletingCampus(c)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sessions */}
        <TabsContent value="sessions" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => openSession()}><Plus className="h-4 w-4" /> {t("academic.addSession")}</Button>
          </div>
          {sessionLoading ? (
            <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
          ) : sessions.length === 0 ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground">{t("academic.noSessions")}</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {sessions.map((s) => (
                <Card key={s.id}>
                  <CardHeader className="flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarRange className="h-4 w-4 text-primary" /> {s.name}
                        {s.isCurrent && <Badge variant="success" dot>{t("academic.current")}</Badge>}
                      </CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(s.startDate)} – {formatDate(s.endDate)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openSession(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingSession(s)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("academic.terms")}</div>
                    {s.terms.length === 0 ? (
                      <span className="text-sm text-muted-foreground">{t("academic.noTerms")}</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {s.terms.map((term: { id: string; name: string; startDate: Date | string; endDate: Date | string }) => (
                          <span key={term.id} className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs">
                            {term.name} <span className="text-muted-foreground">({formatDate(term.startDate)}–{formatDate(term.endDate)})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Campus dialog */}
      <Dialog open={campusOpen} onOpenChange={setCampusOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingCampus ? t("common.edit") + " " + t("academic.campuses") : t("academic.addCampus")}</DialogTitle></DialogHeader>
          <form onSubmit={campusForm.handleSubmit(submitCampus)} className="space-y-4">
            <Field label={t("academic.campusName")} error={campusForm.formState.errors.name?.message} required>
              <Input {...campusForm.register("name")} placeholder="e.g. Main Campus (Dhaka)" />
            </Field>
            <Field label={t("academic.code")} error={campusForm.formState.errors.code?.message} required>
              <Input {...campusForm.register("code")} placeholder="e.g. MAIN" />
            </Field>
            <Field label={t("academic.address")} error={campusForm.formState.errors.address?.message}>
              <Input {...campusForm.register("address")} />
            </Field>
            <Field label={t("academic.phone")} error={campusForm.formState.errors.phone?.message}>
              <Input {...campusForm.register("phone")} />
            </Field>
            <div className="flex items-center gap-2">
              <Switch checked={campusForm.watch("isMain")} onCheckedChange={(c) => campusForm.setValue("isMain", c)} />
              <span className="flex items-center gap-1 text-sm"><Star className="h-3.5 w-3.5" /> {t("academic.mainCampus")}</span>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCampusOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={campusForm.formState.isSubmitting}>
                {campusForm.formState.isSubmitting ? "Saving..." : editingCampus ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Session dialog */}
      <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingSession ? t("common.edit") : t("academic.addSession")}</DialogTitle></DialogHeader>
          <form onSubmit={sessionForm.handleSubmit(submitSession)} className="space-y-4">
            <Field label={t("academic.sessionName")} error={sessionForm.formState.errors.name?.message} required>
              <Input {...sessionForm.register("name")} placeholder="e.g. 2025 or 2025-2026" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("academic.startDate")} error={sessionForm.formState.errors.startDate?.message} required>
                <Input type="date" {...sessionForm.register("startDate")} />
              </Field>
              <Field label={t("academic.endDate")} error={sessionForm.formState.errors.endDate?.message} required>
                <Input type="date" {...sessionForm.register("endDate")} />
              </Field>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={sessionForm.watch("isCurrent")} onCheckedChange={(c) => sessionForm.setValue("isCurrent", c)} />
              <span className="text-sm">{t("academic.setCurrent")}</span>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSessionOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={sessionForm.formState.isSubmitting}>
                {sessionForm.formState.isSubmitting ? "Saving..." : editingSession ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingCampus} onOpenChange={(o) => !o && setDeletingCampus(null)}
        title="Delete campus?" description={`This removes ${deletingCampus?.name}. Linked records will be unassigned.`} onConfirm={deleteCampus}
      />
      <ConfirmDialog
        open={!!deletingSession} onOpenChange={(o) => !o && setDeletingSession(null)}
        title="Delete session?" description={`This removes ${deletingSession?.name} and its terms.`} onConfirm={deleteSession}
      />
    </div>
  );
}
