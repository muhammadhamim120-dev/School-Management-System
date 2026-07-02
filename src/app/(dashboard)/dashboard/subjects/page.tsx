"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/form-field";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useResourceList } from "@/hooks/use-resource-list";
import { subjectSchema, type SubjectInput } from "@/lib/validations";
import { subjectsApi, classesApi, teachersApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import type { SubjectWithRelations, Class, Teacher } from "@/types";

export default function SubjectsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const list = useResourceList<SubjectWithRelations>(subjectsApi.list);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SubjectWithRelations | null>(null);
  const [deleting, setDeleting] = React.useState<SubjectWithRelations | null>(null);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);

  React.useEffect(() => {
    classesApi.list({ limit: 100 }).then((d) => setClasses(d.items)).catch(() => {});
    teachersApi.list({ limit: 100 }).then((d) => setTeachers(d.items)).catch(() => {});
  }, []);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<SubjectInput>({ resolver: zodResolver(subjectSchema) });

  const openForm = (s?: SubjectWithRelations) => {
    setEditing(s ?? null);
    reset({ name: s?.name ?? "", code: s?.code ?? "", classId: s?.classId ?? "", teacherId: s?.teacherId ?? "" });
    setOpen(true);
  };

  const onSubmit = async (values: SubjectInput) => {
    try {
      if (editing) await subjectsApi.update(editing.id, values);
      else await subjectsApi.create(values);
      toast({ variant: "success", title: editing ? "Subject updated" : "Subject created" });
      setOpen(false); list.refresh();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const handleDelete = async () => {
    if (!deleting) return;
    try { await subjectsApi.remove(deleting.id); toast({ variant: "success", title: "Subject deleted" }); setDeleting(null); list.refresh(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };

  const columns: Column<SubjectWithRelations>[] = [
    { key: "name", header: t("col.subject"), render: (s) => <span className="font-medium">{s.name}</span> },
    { key: "code", header: t("col.code") },
    { key: "class", header: t("col.class"), render: (s) => s.class?.name ?? "—" },
    { key: "teacher", header: t("col.teacher"), render: (s) => s.teacher?.fullName ?? "—" },
    {
      key: "actions", header: "", className: "text-right",
      render: (s) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openForm(s)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(s)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("page.subjects.title")}
        description={t("page.subjects.desc")}
        action={<Button onClick={() => openForm()}><Plus className="h-4 w-4" /> {t("page.subjects.add")}</Button>}
      />
      <DataTable
        columns={columns} rows={list.rows} loading={list.loading} total={list.total}
        page={list.page} totalPages={list.totalPages} search={list.search}
        onSearch={list.onSearch} onPage={list.setPage} searchPlaceholder="Search subjects..." rowKey={(s) => s.id}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Subject" : "Add Subject"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label={t("field.subjectName")} error={errors.name?.message} required>
              <Input {...register("name")} placeholder="e.g. Mathematics" />
            </Field>
            <Field label={t("field.code")} error={errors.code?.message} required>
              <Input {...register("code")} placeholder="e.g. MATH101" />
            </Field>
            <Field label={t("field.class")} error={errors.classId?.message}>
              <Select value={watch("classId") || ""} onValueChange={(v) => setValue("classId", v)}>
                <SelectTrigger><SelectValue placeholder={t("opt.selectClass")} /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label={t("field.teacher")} error={errors.teacherId?.message}>
              <Select value={watch("teacherId") || ""} onValueChange={(v) => setValue("teacherId", v)}>
                <SelectTrigger><SelectValue placeholder={t("opt.selectTeacher")} /></SelectTrigger>
                <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.fullName}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : editing ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete subject?" description={`This removes ${deleting?.name}.`} onConfirm={handleDelete}
      />
    </div>
  );
}
