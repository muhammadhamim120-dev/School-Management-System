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
import { examSchema, type ExamInput } from "@/lib/validations";
import { examsApi, classesApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import { formatDate } from "@/lib/utils";
import type { Exam, Class } from "@/types";

type ExamWithClass = Exam & { class: Class | null };

function toDateInput(d?: Date | string | null) { return d ? new Date(d).toISOString().slice(0, 10) : ""; }

export default function ExamsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const list = useResourceList<ExamWithClass>(examsApi.list);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ExamWithClass | null>(null);
  const [deleting, setDeleting] = React.useState<ExamWithClass | null>(null);
  const [classes, setClasses] = React.useState<Class[]>([]);

  React.useEffect(() => { classesApi.list({ limit: 100 }).then((d) => setClasses(d.items)).catch(() => {}); }, []);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<ExamInput>({ resolver: zodResolver(examSchema) });

  const openForm = (e?: ExamWithClass) => {
    setEditing(e ?? null);
    reset({
      name: e?.name ?? "",
      classId: e?.classId ?? "",
      startDate: (toDateInput(e?.startDate) as unknown as Date) ?? undefined,
      endDate: (toDateInput(e?.endDate) as unknown as Date) ?? undefined,
    });
    setOpen(true);
  };

  const onSubmit = async (values: ExamInput) => {
    try {
      if (editing) await examsApi.update(editing.id, values);
      else await examsApi.create(values);
      toast({ variant: "success", title: editing ? "Exam updated" : "Exam created" });
      setOpen(false); list.refresh();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const handleDelete = async () => {
    if (!deleting) return;
    try { await examsApi.remove(deleting.id); toast({ variant: "success", title: "Exam deleted" }); setDeleting(null); list.refresh(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };

  const columns: Column<ExamWithClass>[] = [
    { key: "name", header: t("col.exam"), render: (e) => <span className="font-medium">{e.name}</span> },
    { key: "class", header: t("col.class"), render: (e) => e.class?.name ?? "All" },
    { key: "startDate", header: t("col.start"), render: (e) => formatDate(e.startDate) },
    { key: "endDate", header: t("col.end"), render: (e) => formatDate(e.endDate) },
    {
      key: "actions", header: "", className: "text-right",
      render: (e) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openForm(e)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(e)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("page.exams.title")}
        description={t("page.exams.desc")}
        action={<Button onClick={() => openForm()}><Plus className="h-4 w-4" /> {t("page.exams.add")}</Button>}
      />
      <DataTable
        columns={columns} rows={list.rows} loading={list.loading} total={list.total}
        page={list.page} totalPages={list.totalPages} search={list.search}
        onSearch={list.onSearch} onPage={list.setPage} searchPlaceholder="Search exams..." rowKey={(e) => e.id}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Exam" : "Add Exam"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label={t("field.examName")} error={errors.name?.message} required>
              <Input {...register("name")} placeholder="e.g. Mid-Term 2025" />
            </Field>
            <Field label={t("field.class")} error={errors.classId?.message}>
              <Select value={watch("classId") || ""} onValueChange={(v) => setValue("classId", v)}>
                <SelectTrigger><SelectValue placeholder={t("opt.selectClass")} /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("field.startDate")} error={errors.startDate?.message} required>
                <Input type="date" {...register("startDate")} />
              </Field>
              <Field label={t("field.endDate")} error={errors.endDate?.message} required>
                <Input type="date" {...register("endDate")} />
              </Field>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : editing ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete exam?" description={`This removes ${deleting?.name} and its results.`} onConfirm={handleDelete}
      />
    </div>
  );
}
