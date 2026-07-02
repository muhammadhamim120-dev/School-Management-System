"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Pin } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/form-field";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useResourceList } from "@/hooks/use-resource-list";
import { noticeSchema, type NoticeInput } from "@/lib/validations";
import { noticesApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import { formatDate } from "@/lib/utils";
import type { Notice } from "@/types";

export default function NoticesPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const list = useResourceList<Notice>(noticesApi.list);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Notice | null>(null);
  const [deleting, setDeleting] = React.useState<Notice | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<NoticeInput>({ resolver: zodResolver(noticeSchema) });

  const openForm = (n?: Notice) => {
    setEditing(n ?? null);
    reset({ title: n?.title ?? "", content: n?.content ?? "", audience: n?.audience ?? "ALL", pinned: n?.pinned ?? false });
    setOpen(true);
  };

  const onSubmit = async (values: NoticeInput) => {
    try {
      if (editing) await noticesApi.update(editing.id, values);
      else await noticesApi.create(values);
      toast({ variant: "success", title: editing ? "Notice updated" : "Notice published" });
      setOpen(false); list.refresh();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const handleDelete = async () => {
    if (!deleting) return;
    try { await noticesApi.remove(deleting.id); toast({ variant: "success", title: "Notice deleted" }); setDeleting(null); list.refresh(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };

  const columns: Column<Notice>[] = [
    {
      key: "title", header: t("col.title"),
      render: (n) => (
        <div className="flex items-center gap-2">
          {n.pinned && <Pin className="h-4 w-4 text-primary" />}
          <span className="font-medium">{n.title}</span>
        </div>
      ),
    },
    { key: "audience", header: t("col.audience"), render: (n) => <Badge variant="secondary">{n.audience}</Badge> },
    { key: "createdAt", header: t("col.date"), render: (n) => formatDate(n.createdAt) },
    {
      key: "actions", header: "", className: "text-right",
      render: (n) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openForm(n)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(n)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("page.notices.title")}
        description={t("page.notices.desc")}
        action={<Button onClick={() => openForm()}><Plus className="h-4 w-4" /> {t("page.notices.add")}</Button>}
      />
      <DataTable
        columns={columns} rows={list.rows} loading={list.loading} total={list.total}
        page={list.page} totalPages={list.totalPages} search={list.search}
        onSearch={list.onSearch} onPage={list.setPage} searchPlaceholder="Search notices..." rowKey={(n) => n.id}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Notice" : "Add Notice"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label={t("field.title")} error={errors.title?.message} required>
              <Input {...register("title")} />
            </Field>
            <Field label={t("field.content")} error={errors.content?.message} required>
              <Textarea rows={5} {...register("content")} />
            </Field>
            <div className="grid grid-cols-2 items-end gap-3">
              <Field label={t("field.audience")}>
                <Select value={watch("audience")} onValueChange={(v) => setValue("audience", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t("aud.all")}</SelectItem>
                    <SelectItem value="STUDENTS">{t("aud.students")}</SelectItem>
                    <SelectItem value="PARENTS">{t("aud.parents")}</SelectItem>
                    <SelectItem value="TEACHERS">{t("aud.teachers")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-center gap-2 pb-2">
                <Switch checked={watch("pinned")} onCheckedChange={(c) => setValue("pinned", c)} />
                <span className="text-sm">{t("field.pinToTop")}</span>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : editing ? "Update" : "Publish"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete notice?" description={`This removes "${deleting?.title}".`} onConfirm={handleDelete}
      />
    </div>
  );
}
