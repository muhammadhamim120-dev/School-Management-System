"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Upload, FileText, Users, Paperclip, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/form-field";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useResourceList } from "@/hooks/use-resource-list";
import { homeworkSchema, type HomeworkInput } from "@/lib/validations";
import { homeworkApi, classesApi, subjectsApi, teachersApi } from "@/services/resources";
import { request } from "@/services/api-client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import { formatDate } from "@/lib/utils";
import type { Class, Subject, Teacher, HomeworkWithRelations } from "@/types";

type Hw = HomeworkWithRelations;

type Submission = {
  id: string;
  status: string;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  submittedAt: string;
  marks: number | null;
  totalMarks: number;
  feedback: string | null;
  gradedAt: string | null;
  student: { id: string; fullName: string; studentId: string; class?: Class | null; section?: { name: string } | null };
};

const toDateInput = (d?: Date | string | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

// Upload a file via the generic endpoint (FormData — bypasses the JSON client).
async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || "Upload failed");
  return json.data.url as string;
}

export default function HomeworkPage() {
  const { t, num } = useI18n();
  const { toast } = useToast();
  const [classFilter, setClassFilter] = React.useState("");
  const list = useResourceList<Hw>(
    (p) => homeworkApi.list({ ...p, filters: { ...(classFilter ? { classId: classFilter } : {}) } }),
    10
  );
  React.useEffect(() => { list.refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [classFilter]);

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Hw | null>(null);
  const [deleting, setDeleting] = React.useState<Hw | null>(null);
  const [detail, setDetail] = React.useState<Hw | null>(null);

  const [classes, setClasses] = React.useState<Class[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [sections, setSections] = React.useState<{ id: string; name: string }[]>([]);
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    classesApi.list({ limit: 100 }).then((d) => setClasses(d.items)).catch(() => {});
    subjectsApi.list({ limit: 200 }).then((d) => setSubjects(d.items)).catch(() => {});
    teachersApi.list({ limit: 200 }).then((d) => setTeachers(d.items)).catch(() => {});
  }, []);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<HomeworkInput>({ resolver: zodResolver(homeworkSchema) });

  const openForm = (e?: Hw) => {
    setEditing(e ?? null);
    const sec = e?.sectionId ? [{ id: e.sectionId, name: e.section?.name ?? "" }] : [];
    setSections(sec);
    reset({
      classId: e?.classId ?? "",
      sectionId: e?.sectionId ?? "",
      subjectId: e?.subjectId ?? "",
      teacherId: e?.teacherId ?? "",
      title: e?.title ?? "",
      details: e?.details ?? "",
      attachmentUrl: e?.attachmentUrl ?? "",
      dueDate: (toDateInput(e?.dueDate) as unknown as Date) ?? undefined,
      notifyParents: false,
    });
    setOpen(true);
  };

  const onPickClass = (classId: string) => {
    setValue("classId", classId);
    const c = classes.find((x) => x.id === classId);
    // The Class list shape doesn't include sections in the resource type, so
    // derive sections via the dedicated sections resource when needed.
    setSections([]);
    if (classId) {
      import("@/services/resources").then((m) =>
        m.sectionsApi.list({ limit: 100, filters: { classId } }).then((d) => setSections(d.items as { id: string; name: string }[])).catch(() => {})
      );
    }
    void c;
  };

  const onSubmit = async (values: HomeworkInput) => {
    try {
      if (editing) await homeworkApi.update(editing.id, values);
      else await homeworkApi.create(values);
      toast({ variant: "success", title: editing ? t("hw.edit") : t("hw.assign") });
      if (values.notifyParents) toast({ variant: "success", title: t("hw.notified") });
      setOpen(false); list.refresh();
    } catch (e) { toast({ variant: "destructive", title: t("common.error"), description: (e as Error).message }); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try { await homeworkApi.remove(deleting.id); toast({ variant: "success", title: t("common.delete") }); setDeleting(null); list.refresh(); }
    catch (e) { toast({ variant: "destructive", title: t("common.error"), description: (e as Error).message }); }
  };

  const columns: Column<Hw>[] = [
    { key: "title", header: t("hw.title"), render: (h) => (
      <div className="space-y-0.5">
        <div className="font-medium">{h.title}</div>
        <div className="text-xs text-muted-foreground line-clamp-1">{h.details}</div>
      </div>
    ) },
    { key: "class", header: t("col.class"), render: (h) => `${h.class?.name ?? "—"}${h.section?.name ? ` (${h.section.name})` : ""}` },
    { key: "subject", header: t("page.subjects.title"), render: (h) => h.subject?.name ?? "—" },
    { key: "due", header: t("hw.dueDate"), render: (h) => formatDate(h.dueDate) },
    { key: "submissions", header: t("hw.submissions"), render: (h) => (
      <Badge variant="secondary">{num(h._count?.submissions ?? 0)}</Badge>
    ) },
    { key: "actions", header: "", className: "text-right", render: (h) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" title={t("hw.viewSubmissions")} onClick={() => setDetail(h)}><Users className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => openForm(h)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(h)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader
        title={t("page.homework.title")}
        description={t("page.homework.desc")}
        action={<Button onClick={() => openForm()}><Plus className="h-4 w-4" /> {t("page.homework.add")}</Button>}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder={t("hw.allClasses")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("hw.allClasses")}</SelectItem>
            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns} rows={list.rows} loading={list.loading} total={list.total}
        page={list.page} totalPages={list.totalPages} search={list.search}
        onSearch={list.onSearch} onPage={list.setPage} searchPlaceholder={t("common.search")} rowKey={(h) => h.id}
      />

      {/* Create / edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? t("hw.edit") : t("hw.newAssignment")}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("col.class")} error={errors.classId?.message} required>
                <Select value={watch("classId") || ""} onValueChange={onPickClass}>
                  <SelectTrigger><SelectValue placeholder={t("opt.selectClass")} /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label={t("col.section")} error={errors.sectionId?.message}>
                <Select value={watch("sectionId") || ""} onValueChange={(v) => setValue("sectionId", v === "ALL" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder={t("hw.allClasses")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t("hw.allClasses")}</SelectItem>
                    {sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("page.subjects.title")} error={errors.subjectId?.message}>
                <Select value={watch("subjectId") || ""} onValueChange={(v) => setValue("subjectId", v === "NONE" ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">—</SelectItem>
                    {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("nav.teachers")} error={errors.teacherId?.message}>
                <Select value={watch("teacherId") || ""} onValueChange={(v) => setValue("teacherId", v === "NONE" ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">—</SelectItem>
                    {teachers.map((tc) => <SelectItem key={tc.id} value={tc.id}>{tc.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label={t("hw.title")} error={errors.title?.message} required>
              <Input {...register("title")} placeholder={t("hw.title")} />
            </Field>
            <Field label={t("hw.details")} error={errors.details?.message} required>
              <Textarea rows={3} {...register("details")} />
            </Field>
            <Field label={t("hw.attachFile")}>
              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                  <Upload className="h-4 w-4" /> {uploading ? "…" : t("hw.uploadFile")}
                  <input type="file" className="hidden" disabled={uploading} onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    try { setUploading(true); const url = await uploadFile(f); setValue("attachmentUrl", url); toast({ variant: "success", title: t("hw.attachFile") }); }
                    catch (err) { toast({ variant: "destructive", title: "Error", description: (err as Error).message }); }
                    finally { setUploading(false); }
                  }} />
                </label>
                {watch("attachmentUrl") && (
                  <a href={watch("attachmentUrl")} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Paperclip className="h-3 w-3" /> {t("hw.attachFile")}
                  </a>
                )}
              </div>
            </Field>
            <Field label={t("hw.dueDate")} error={errors.dueDate?.message} required>
              <Input type="date" {...register("dueDate")} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={!!watch("notifyParents")} onCheckedChange={(v) => setValue("notifyParents", v)} />
              <MessageSquare className="h-4 w-4 text-muted-foreground" /> {t("hw.notifyParents")}
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "…" : editing ? t("common.save") : t("hw.assign")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Submissions / grading dialog */}
      <SubmissionsDialog hw={detail} onClose={() => setDetail(null)} onChanged={() => list.refresh()} />

      <ConfirmDialog
        open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}
        title={t("common.delete")} description={deleting?.title ?? ""} onConfirm={handleDelete}
      />
    </div>
  );
}

function SubmissionsDialog({ hw, onClose, onChanged }: { hw: Hw | null; onClose: () => void; onChanged: () => void }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [items, setItems] = React.useState<Submission[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [students, setStudents] = React.useState<{ id: string; fullName: string; studentId: string }[]>([]);
  const [pickStudent, setPickStudent] = React.useState("");
  const [subFile, setSubFile] = React.useState("");
  const [subContent, setSubContent] = React.useState("");

  const load = React.useCallback(async () => {
    if (!hw) return;
    setLoading(true);
    try {
      const d = await request<{ items: Submission[] }>(`/api/homework/${hw.id}/submissions`);
      setItems(d.items);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [hw]);

  React.useEffect(() => { if (hw) { load(); } }, [hw, load]);

  // Load students of the class for the "submit on behalf" picker.
  React.useEffect(() => {
    if (!hw) return;
    import("@/services/resources").then((m) =>
      m.studentsApi.list({ limit: 200, filters: { classId: hw.classId } })
        .then((d) => setStudents(d.items.map((s) => ({ id: s.id, fullName: s.fullName, studentId: s.studentId }))))
        .catch(() => {})
    );
  }, [hw]);

  const submitFor = async () => {
    if (!hw || !pickStudent) return;
    try {
      await request(`/api/homework/${hw.id}/submissions`, {
        method: "POST", body: JSON.stringify({ studentId: pickStudent, content: subContent || undefined, fileUrl: subFile || undefined }),
      });
      toast({ variant: "success", title: t("hw.submitted") });
      setPickStudent(""); setSubContent(""); setSubFile("");
      load(); onChanged();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };

  return (
    <Dialog open={!!hw} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> {hw?.title}</DialogTitle>
        </DialogHeader>
        {hw && (
          <Tabs defaultValue="subs">
            <TabsList>
              <TabsTrigger value="subs">{t("hw.submissions")} ({items.length})</TabsTrigger>
              <TabsTrigger value="add">{t("hw.submitFor")}</TabsTrigger>
            </TabsList>
            <TabsContent value="subs" className="mt-4 space-y-3">
              {loading ? <div className="text-sm text-muted-foreground">{t("common.loading")}</div> :
                items.length === 0 ? <div className="text-sm text-muted-foreground">{t("hw.noSubmissions")}</div> :
                items.map((s) => <SubmissionRow key={s.id} sub={s} onChanged={load} />)}
            </TabsContent>
            <TabsContent value="add" className="mt-4 space-y-3">
              <Field label={t("hw.submitFor")}>
                <Select value={pickStudent} onValueChange={setPickStudent}>
                  <SelectTrigger><SelectValue placeholder={t("hw.submitFor")} /></SelectTrigger>
                  <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.studentId})</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label={t("hw.answer")}>
                <Textarea rows={2} value={subContent} onChange={(e) => setSubContent(e.target.value)} />
              </Field>
              <Field label={t("hw.answerFile")}>
                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                    <Upload className="h-4 w-4" /> {t("hw.uploadFile")}
                    <input type="file" className="hidden" onChange={async (e) => {
                      const f = e.target.files?.[0]; if (!f) return;
                      try { setSubFile(await uploadFile(f)); } catch (err) { toast({ variant: "destructive", title: "Error", description: (err as Error).message }); }
                    }} />
                  </label>
                  {subFile && <a href={subFile} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline"><Paperclip className="inline h-3 w-3" /> file</a>}
                </div>
              </Field>
              <Button onClick={submitFor} disabled={!pickStudent}>{t("hw.submit")}</Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SubmissionRow({ sub, onChanged }: { sub: Submission; onChanged: () => void }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [marks, setMarks] = React.useState(String(sub.marks ?? ""));
  const [total, setTotal] = React.useState(String(sub.totalMarks));
  const [feedback, setFeedback] = React.useState(sub.feedback ?? "");
  const graded = sub.gradedAt != null;

  const save = async () => {
    try {
      await request(`/api/homework/_/submissions/${sub.id}`, {
        method: "PATCH", body: JSON.stringify({ marks: Number(marks) || 0, totalMarks: Number(total) || 100, feedback: feedback || undefined }),
      });
      toast({ variant: "success", title: t("hw.graded") });
      onChanged();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };

  const statusBadge = (st: string) => {
    const map: Record<string, string> = { SUBMITTED: t("hw.submitted"), GRADED: t("hw.graded"), LATE: t("hw.late"), RETURNED: t("hw.returned") };
    return map[st] ?? st;
  };

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{sub.student.fullName}</div>
          <div className="text-xs text-muted-foreground">{sub.student.studentId} · {formatDate(sub.submittedAt)}</div>
        </div>
        <Badge variant={graded ? "default" : "secondary"}>{statusBadge(sub.status)}</Badge>
      </div>
      {(sub.content || sub.fileUrl) && (
        <div className="mt-2 text-sm">
          {sub.content && <p className="text-muted-foreground">{sub.content}</p>}
          {sub.fileUrl && <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Paperclip className="h-3 w-3" /> {sub.fileName ?? "file"}</a>}
        </div>
      )}
      <div className="mt-3 grid grid-cols-[80px_1fr] items-end gap-2 sm:grid-cols-[80px_80px_1fr_auto]">
        <Field label={t("hw.marks")}>
          <Input type="number" value={marks} onChange={(e) => setMarks(e.target.value)} />
        </Field>
        <Field label="/">
          <Input type="number" value={total} onChange={(e) => setTotal(e.target.value)} />
        </Field>
        <Field label={t("hw.feedback")}>
          <Input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder={t("hw.feedback")} />
        </Field>
        <Button onClick={save} size="sm">{t("hw.grade")}</Button>
      </div>
    </div>
  );
}
