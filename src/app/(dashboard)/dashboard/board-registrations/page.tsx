"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Download, FileSpreadsheet, Printer } from "lucide-react";
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
import { boardRegistrationSchema, type BoardRegistrationInput } from "@/lib/validations";
import { boardRegistrationsApi, studentsApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import type { BoardRegistrationWithStudent, StudentWithRelations } from "@/types";

const statusVariant = (s: string) =>
  s === "APPROVED" ? "success" : s === "REJECTED" ? "destructive" : s === "REGISTERED" ? "default" : "secondary";

export default function BoardRegistrationsPage() {
  const { toast } = useToast();
  const { t } = useI18n();
  const list = useResourceList<BoardRegistrationWithStudent>(boardRegistrationsApi.list);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<BoardRegistrationWithStudent | null>(null);
  const [deleting, setDeleting] = React.useState<BoardRegistrationWithStudent | null>(null);
  const [students, setStudents] = React.useState<StudentWithRelations[]>([]);

  React.useEffect(() => {
    studentsApi.list({ limit: 100 }).then((d) => setStudents(d.items)).catch(() => {});
  }, []);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<BoardRegistrationInput>({ resolver: zodResolver(boardRegistrationSchema) });

  const openForm = (r?: BoardRegistrationWithStudent) => {
    setEditing(r ?? null);
    reset({
      studentId: r?.studentId ?? "",
      boardExam: (r?.boardExam as BoardRegistrationInput["boardExam"]) ?? "JSC",
      regNumber: r?.regNumber ?? "",
      rollNumber: r?.rollNumber ?? "",
      examYear: r?.examYear ?? new Date().getFullYear(),
      boardName: r?.boardName ?? "",
      status: (r?.status as BoardRegistrationInput["status"]) ?? "PENDING",
    });
    setOpen(true);
  };

  const onSubmit = async (values: BoardRegistrationInput) => {
    try {
      if (editing) await boardRegistrationsApi.update(editing.id, values);
      else await boardRegistrationsApi.create(values);
      toast({ variant: "success", title: editing ? "Registration updated" : "Registration created" });
      setOpen(false); list.refresh();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const handleDelete = async () => {
    if (!deleting) return;
    try { await boardRegistrationsApi.remove(deleting.id); toast({ variant: "success", title: "Registration deleted" }); setDeleting(null); list.refresh(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };

  const exportFormat = (format: "csv" | "xls") => {
    const params = new URLSearchParams({ format });
    if (list.filters.boardExam) params.set("boardExam", list.filters.boardExam);
    if (list.filters.status) params.set("status", list.filters.status);
    if (list.filters.examYear) params.set("examYear", list.filters.examYear);
    window.open(`/api/board-registrations?${params.toString()}`, "_blank");
  };

  const columns: Column<BoardRegistrationWithStudent>[] = [
    { key: "student", header: "Student", render: (r) => (
      <div>
        <div className="font-medium">{r.student?.fullName ?? "—"}</div>
        <div className="text-xs text-muted-foreground">{r.student?.studentId ?? ""}</div>
      </div>
    ) },
    { key: "boardExam", header: "Board Exam", render: (r) => <Badge variant="secondary">{r.boardExam}</Badge> },
    { key: "examYear", header: "Year", render: (r) => <span className="tabular-nums">{r.examYear}</span> },
    { key: "regNumber", header: "Reg No.", render: (r) => r.regNumber ?? "—" },
    { key: "rollNumber", header: "Roll", render: (r) => r.rollNumber ?? "—" },
    { key: "boardName", header: "Board", render: (r) => r.boardName ?? "—" },
    { key: "status", header: "Status", render: (r) => <Badge variant={statusVariant(r.status)} dot>{r.status}</Badge> },
    {
      key: "actions", header: "", className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openForm(r)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(r)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1].map((y) => ({ label: String(y), value: String(y) }));

  return (
    <div>
      <PageHeader
        title={t("board.title")}
        description={t("board.subtitle")}
        action={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={() => exportFormat("csv")}><Download className="h-4 w-4" /> {t("board.exportCsv")}</Button>
            <Button variant="outline" size="sm" onClick={() => exportFormat("xls")}><FileSpreadsheet className="h-4 w-4" /> {t("board.exportExcel")}</Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" /> {t("board.exportPdf")}</Button>
            <Button size="sm" onClick={() => openForm()}><Plus className="h-4 w-4" /> {t("board.add")}</Button>
          </div>
        }
      />
      <div className="print:hidden">
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
        rowKey={(r) => r.id}
        filters={
          <>
            <TableFilter
              placeholder={t("board.allExams")} value={list.filters.boardExam}
              onChange={(v) => list.setFilter("boardExam", v)}
              options={[
                { label: t("board.exam.PEC"), value: "PEC" },
                { label: t("board.exam.JSC"), value: "JSC" },
                { label: t("board.exam.SSC"), value: "SSC" },
                { label: t("board.exam.HSC"), value: "HSC" },
                { label: t("board.exam.EBTEDAYEE"), value: "EBTEDAYEE" },
                { label: t("board.exam.DAKHIL"), value: "DAKHIL" },
                { label: t("board.exam.ALIM"), value: "ALIM" },
              ]}
            />
            <TableFilter
              placeholder={t("board.allYears")} value={list.filters.examYear}
              onChange={(v) => list.setFilter("examYear", v)}
              options={yearOptions}
            />
            <TableFilter
              placeholder={t("board.allStatuses")} value={list.filters.status}
              onChange={(v) => list.setFilter("status", v)}
              options={[
                { label: t("status.PENDING"), value: "PENDING" },
                { label: t("status.REGISTERED"), value: "REGISTERED" },
                { label: t("status.APPROVED"), value: "APPROVED" },
                { label: t("status.REJECTED"), value: "REJECTED" },
              ]}
            />
          </>
        }
      />
      </div>

      {/* Print-only clean table for PDF export via the browser print dialog */}
      <div className="hidden print:block">
        <h1 className="mb-3 text-lg font-bold">{t("board.title")}</h1>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b">
              <th className="py-1 text-left">{t("board.exam")}</th>
              <th className="py-1 text-left">Student</th>
              <th className="py-1 text-left">{t("board.year")}</th>
              <th className="py-1 text-left">{t("board.regNo")}</th>
              <th className="py-1 text-left">{t("board.roll")}</th>
              <th className="py-1 text-left">{t("board.boardName")}</th>
              <th className="py-1 text-left">{t("board.status")}</th>
            </tr>
          </thead>
          <tbody>
            {list.rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-1">{r.boardExam}</td>
                <td className="py-1">{r.student?.fullName ?? "—"}</td>
                <td className="py-1 tabular-nums">{r.examYear}</td>
                <td className="py-1 tabular-nums">{r.regNumber ?? "—"}</td>
                <td className="py-1 tabular-nums">{r.rollNumber ?? "—"}</td>
                <td className="py-1">{r.boardName ?? "—"}</td>
                <td className="py-1">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Registration" : "Add Registration"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Student" error={errors.studentId?.message} required>
              <Select value={watch("studentId") || ""} onValueChange={(v) => setValue("studentId", v)}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("board.exam")} error={errors.boardExam?.message} required>
                <Select value={watch("boardExam")} onValueChange={(v) => setValue("boardExam", v as BoardRegistrationInput["boardExam"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PEC">{t("board.exam.PEC")}</SelectItem>
                    <SelectItem value="JSC">{t("board.exam.JSC")}</SelectItem>
                    <SelectItem value="SSC">{t("board.exam.SSC")}</SelectItem>
                    <SelectItem value="HSC">{t("board.exam.HSC")}</SelectItem>
                    <SelectItem value="EBTEDAYEE">{t("board.exam.EBTEDAYEE")}</SelectItem>
                    <SelectItem value="DAKHIL">{t("board.exam.DAKHIL")}</SelectItem>
                    <SelectItem value="ALIM">{t("board.exam.ALIM")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("board.year")} error={errors.examYear?.message} required>
                <Input type="number" min={2000} max={2100} {...register("examYear")} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("board.regNo")} error={errors.regNumber?.message}>
                <Input {...register("regNumber")} />
              </Field>
              <Field label={t("board.roll")} error={errors.rollNumber?.message}>
                <Input {...register("rollNumber")} />
              </Field>
            </div>
            <Field label={t("board.boardName")} error={errors.boardName?.message}>
              <Input {...register("boardName")} placeholder="e.g. Dhaka, Rajshahi" />
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v as BoardRegistrationInput["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REGISTERED">Registered</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : editing ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete registration?" description="This permanently removes the board registration record." onConfirm={handleDelete}
      />
    </div>
  );
}
