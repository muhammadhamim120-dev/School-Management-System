"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/form-field";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useResourceList } from "@/hooks/use-resource-list";
import { eventSchema, type EventInput } from "@/lib/validations";
import { eventsApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/types";

function toDateInput(d?: Date | string | null) { return d ? new Date(d).toISOString().slice(0, 10) : ""; }
const statusVariant = (s: string) => (s === "UPCOMING" ? "default" : s === "ONGOING" ? "success" : s === "CANCELLED" ? "destructive" : "secondary");

export default function EventsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const list = useResourceList<Event>(eventsApi.list);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Event | null>(null);
  const [deleting, setDeleting] = React.useState<Event | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<EventInput>({ resolver: zodResolver(eventSchema) });

  const openForm = (e?: Event) => {
    setEditing(e ?? null);
    reset({
      title: e?.title ?? "",
      description: e?.description ?? "",
      location: e?.location ?? "",
      startDate: (toDateInput(e?.startDate) as unknown as Date) ?? undefined,
      endDate: (toDateInput(e?.endDate) as unknown as Date) ?? undefined,
      status: (e?.status as EventInput["status"]) ?? "UPCOMING",
    });
    setOpen(true);
  };

  const onSubmit = async (values: EventInput) => {
    try {
      if (editing) await eventsApi.update(editing.id, values);
      else await eventsApi.create(values);
      toast({ variant: "success", title: editing ? "Event updated" : "Event created" });
      setOpen(false); list.refresh();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const handleDelete = async () => {
    if (!deleting) return;
    try { await eventsApi.remove(deleting.id); toast({ variant: "success", title: "Event deleted" }); setDeleting(null); list.refresh(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };

  const columns: Column<Event>[] = [
    { key: "title", header: t("col.event"), render: (e) => <span className="font-medium">{e.title}</span> },
    { key: "location", header: t("col.location"), render: (e) => e.location ?? "—" },
    { key: "startDate", header: t("col.start"), render: (e) => formatDate(e.startDate) },
    { key: "endDate", header: t("col.end"), render: (e) => formatDate(e.endDate) },
    { key: "status", header: t("col.status"), render: (e) => <Badge variant={statusVariant(e.status)}>{e.status}</Badge> },
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
        title={t("page.events.title")}
        description={t("page.events.desc")}
        action={<Button onClick={() => openForm()}><Plus className="h-4 w-4" /> {t("page.events.add")}</Button>}
      />
      <DataTable
        columns={columns} rows={list.rows} loading={list.loading} total={list.total}
        page={list.page} totalPages={list.totalPages} search={list.search}
        onSearch={list.onSearch} onPage={list.setPage} searchPlaceholder="Search events..." rowKey={(e) => e.id}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Event" : "Add Event"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label={t("field.title")} error={errors.title?.message} required>
              <Input {...register("title")} />
            </Field>
            <Field label={t("field.description")} error={errors.description?.message}>
              <Textarea rows={3} {...register("description")} />
            </Field>
            <Field label={t("field.location")} error={errors.location?.message}>
              <Input {...register("location")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("field.startDate")} error={errors.startDate?.message} required>
                <Input type="date" {...register("startDate")} />
              </Field>
              <Field label={t("field.endDate")} error={errors.endDate?.message} required>
                <Input type="date" {...register("endDate")} />
              </Field>
            </div>
            <Field label={t("field.status")} error={errors.status?.message}>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v as EventInput["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPCOMING">{t("evt.upcoming")}</SelectItem>
                  <SelectItem value="ONGOING">{t("evt.ongoing")}</SelectItem>
                  <SelectItem value="COMPLETED">{t("evt.completed")}</SelectItem>
                  <SelectItem value="CANCELLED">{t("evt.cancelled")}</SelectItem>
                </SelectContent>
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
        title="Delete event?" description={`This removes "${deleting?.title}".`} onConfirm={handleDelete}
      />
    </div>
  );
}
