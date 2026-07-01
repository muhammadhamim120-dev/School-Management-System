"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/form-field";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useResourceList } from "@/hooks/use-resource-list";
import { feeSchema, type FeeInput } from "@/lib/validations";
import { feesApi, studentsApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Fee, StudentWithRelations } from "@/types";

type FeeRow = Fee & { student?: { fullName: string; studentId: string } };
function toDateInput(d?: Date | string | null) { return d ? new Date(d).toISOString().slice(0, 10) : ""; }
const statusVariant = (s: string) => (s === "PAID" ? "success" : s === "OVERDUE" ? "destructive" : s === "PARTIAL" ? "warning" : "secondary");

export default function FeesPage() {
  const { toast } = useToast();
  const list = useResourceList<FeeRow>(feesApi.list);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<FeeRow | null>(null);
  const [deleting, setDeleting] = React.useState<FeeRow | null>(null);
  const [students, setStudents] = React.useState<StudentWithRelations[]>([]);

  React.useEffect(() => { studentsApi.list({ limit: 100 }).then((d) => setStudents(d.items)).catch(() => {}); }, []);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FeeInput>({ resolver: zodResolver(feeSchema) });

  const openForm = (f?: FeeRow) => {
    setEditing(f ?? null);
    reset({
      studentId: f?.studentId ?? "",
      title: f?.title ?? "",
      amount: f?.amount ?? 0,
      paidAmount: f?.paidAmount ?? 0,
      dueDate: (toDateInput(f?.dueDate) as unknown as Date) ?? undefined,
      status: (f?.status as FeeInput["status"]) ?? "UNPAID",
    });
    setOpen(true);
  };

  const onSubmit = async (values: FeeInput) => {
    try {
      if (editing) await feesApi.update(editing.id, values);
      else await feesApi.create(values);
      toast({ variant: "success", title: editing ? "Fee updated" : "Fee created" });
      setOpen(false); list.refresh();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const handleDelete = async () => {
    if (!deleting) return;
    try { await feesApi.remove(deleting.id); toast({ variant: "success", title: "Fee deleted" }); setDeleting(null); list.refresh(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };

  const columns: Column<FeeRow>[] = [
    { key: "title", header: "Title", render: (f) => <span className="font-medium">{f.title}</span> },
    { key: "student", header: "Student", render: (f) => f.student?.fullName ?? "—" },
    { key: "amount", header: "Amount", render: (f) => formatCurrency(f.amount) },
    { key: "paidAmount", header: "Paid", render: (f) => formatCurrency(f.paidAmount) },
    { key: "dueDate", header: "Due", render: (f) => formatDate(f.dueDate) },
    { key: "status", header: "Status", render: (f) => <Badge variant={statusVariant(f.status)}>{f.status}</Badge> },
    {
      key: "actions", header: "", className: "text-right",
      render: (f) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openForm(f)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(f)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Fees"
        description="Track fee payments and dues"
        action={<Button onClick={() => openForm()}><Plus className="h-4 w-4" /> Add Fee</Button>}
      />
      <DataTable
        columns={columns} rows={list.rows} loading={list.loading} total={list.total}
        page={list.page} totalPages={list.totalPages} search={list.search}
        onSearch={list.onSearch} onPage={list.setPage} searchPlaceholder="Search fees..." rowKey={(f) => f.id}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Fee" : "Add Fee"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Student" error={errors.studentId?.message} required>
              <Select value={watch("studentId") || ""} onValueChange={(v) => setValue("studentId", v)}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Title" error={errors.title?.message} required>
              <Input {...register("title")} placeholder="e.g. Term 1 Tuition" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount" error={errors.amount?.message} required>
                <Input type="number" min={0} step="0.01" {...register("amount")} />
              </Field>
              <Field label="Paid Amount" error={errors.paidAmount?.message}>
                <Input type="number" min={0} step="0.01" {...register("paidAmount")} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Due Date" error={errors.dueDate?.message} required>
                <Input type="date" {...register("dueDate")} />
              </Field>
              <Field label="Status" error={errors.status?.message}>
                <Select value={watch("status")} onValueChange={(v) => setValue("status", v as FeeInput["status"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNPAID">Unpaid</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                  </SelectContent>
                </Select>
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
        title="Delete fee?" description={`This removes "${deleting?.title}".`} onConfirm={handleDelete}
      />
    </div>
  );
}
