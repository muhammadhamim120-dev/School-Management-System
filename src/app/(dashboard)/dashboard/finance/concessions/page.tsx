"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { TableFilter } from "@/components/dashboard/table-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/form-field";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useResourceList } from "@/hooks/use-resource-list";
import { concessionSchema, type ConcessionInput } from "@/lib/validations";
import { concessionsApi, studentsApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import type { ConcessionWithStudent, StudentWithRelations } from "@/types";

const typeVariant = (t: string) => (t === "SCHOLARSHIP" ? "success" : t === "WAIVER" ? "warning" : "default");

export default function ConcessionsPage() {
  const { toast } = useToast();
  const { t, num } = useI18n();
  const list = useResourceList<ConcessionWithStudent>(concessionsApi.list);
  const [students, setStudents] = React.useState<StudentWithRelations[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ConcessionWithStudent | null>(null);
  const [deleting, setDeleting] = React.useState<ConcessionWithStudent | null>(null);

  React.useEffect(() => {
    studentsApi.list({ limit: 200 }).then((d) => setStudents(d.items)).catch(() => {});
  }, []);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<ConcessionInput>({ resolver: zodResolver(concessionSchema) });

  const openForm = (c?: ConcessionWithStudent) => {
    setEditing(c ?? null);
    reset({
      studentId: c?.studentId ?? "",
      type: (c?.type as ConcessionInput["type"]) ?? "DISCOUNT",
      mode: (c?.mode as ConcessionInput["mode"]) ?? "PERCENTAGE",
      value: c?.value ?? 0,
      reason: c?.reason ?? "",
      isActive: c?.isActive ?? true,
    });
    setOpen(true);
  };

  const onSubmit = async (values: ConcessionInput) => {
    try {
      if (editing) await concessionsApi.update(editing.id, values);
      else await concessionsApi.create(values);
      toast({ variant: "success", title: editing ? "Concession updated" : "Concession created" });
      setOpen(false); list.refresh();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const handleDelete = async () => {
    if (!deleting) return;
    try { await concessionsApi.remove(deleting.id); toast({ variant: "success", title: "Concession deleted" }); setDeleting(null); list.refresh(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };

  const columns: Column<ConcessionWithStudent>[] = [
    { key: "student", header: t("fin.student"), render: (c) => c.student?.fullName ?? "—" },
    { key: "type", header: t("fin.type"), render: (c) => <Badge variant={typeVariant(c.type)}>{c.type}</Badge> },
    { key: "mode", header: t("fin.mode"), render: (c) => c.mode },
    { key: "value", header: t("fin.value"), render: (c) => <span className="tabular-nums">{c.mode === "PERCENTAGE" ? `${num(c.value)}%` : num(c.value)}</span> },
    { key: "reason", header: t("fin.reason"), render: (c) => c.reason ?? "—" },
    { key: "active", header: t("fin.active"), render: (c) => <Badge variant={c.isActive ? "success" : "secondary"} dot>{c.isActive ? "Yes" : "No"}</Badge> },
    {
      key: "actions", header: "", className: "text-right",
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openForm(c)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("fin.concessions")}
        description={t("fin.concessionsDesc")}
        action={<Button onClick={() => openForm()}><Plus className="h-4 w-4" /> {t("fin.addConcession")}</Button>}
      />
      <DataTable
        columns={columns}
        rows={list.rows}
        loading={list.loading}
        error={list.error}
        total={list.total}
        page={list.page}
        totalPages={list.totalPages}
        search={list.search}
        onSearch={list.onSearch}
        onPage={list.setPage}
        activeFilterCount={list.activeFilterCount}
        onClearFilters={list.clearFilters}
        onRetry={list.refresh}
        searchPlaceholder="Search…"
        rowKey={(c) => c.id}
        filters={
          <TableFilter
            placeholder={t("fin.type")} value={list.filters.type}
            onChange={(v) => list.setFilter("type", v)}
            options={[
              { label: "Discount", value: "DISCOUNT" },
              { label: "Scholarship", value: "SCHOLARSHIP" },
              { label: "Waiver", value: "WAIVER" },
            ]}
          />
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? t("common.edit") : t("fin.addConcession")}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label={t("fin.student")} error={errors.studentId?.message} required>
              <Select value={watch("studentId")} onValueChange={(v) => setValue("studentId", v)}>
                <SelectTrigger><SelectValue placeholder={t("opt.selectStudent")} /></SelectTrigger>
                <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("fin.type")} error={errors.type?.message} required>
                <Select value={watch("type")} onValueChange={(v) => setValue("type", v as ConcessionInput["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISCOUNT">Discount</SelectItem>
                    <SelectItem value="SCHOLARSHIP">Scholarship</SelectItem>
                    <SelectItem value="WAIVER">Waiver</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("fin.mode")} error={errors.mode?.message}>
                <Select value={watch("mode")} onValueChange={(v) => setValue("mode", v as ConcessionInput["mode"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">{t("fin.percentage")}</SelectItem>
                    <SelectItem value="FIXED">{t("fin.fixed")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label={t("fin.value")} error={errors.value?.message} required><Input type="number" min={0} {...register("value")} /></Field>
            <Field label={t("fin.reason")} error={errors.reason?.message}><Input {...register("reason")} /></Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : t("common.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete concession?" description="This permanently removes the concession." onConfirm={handleDelete} />
    </div>
  );
}
