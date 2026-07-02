"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, RotateCcw, Undo2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { TableFilter } from "@/components/dashboard/table-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/form-field";
import { useResourceList } from "@/hooks/use-resource-list";
import { issueLoanSchema, type IssueLoanInput } from "@/lib/validations";
import { loansApi, bookCopiesApi, studentsApi, teachersApi } from "@/services/resources";
import { request } from "@/services/api-client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import type { BookLoanWithRelations, BookCopy, StudentWithRelations, Teacher } from "@/types";

const loanStatusVariant = (s: string) =>
  s === "RETURNED" ? "success" : s === "OVERDUE" || s === "LOST" ? "destructive" : s === "DAMAGED" ? "warning" : "default";

type CopyWithBook = BookCopy & { book?: { title: string } | null };

export default function LoansPage() {
  const { toast } = useToast();
  const { t, num, money, date } = useI18n();
  const list = useResourceList<BookLoanWithRelations>(loansApi.list);

  const [copies, setCopies] = React.useState<CopyWithBook[]>([]);
  const [students, setStudents] = React.useState<StudentWithRelations[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [issueOpen, setIssueOpen] = React.useState(false);

  const [returnFor, setReturnFor] = React.useState<BookLoanWithRelations | null>(null);
  const [fine, setFine] = React.useState("0");
  const [finePaid, setFinePaid] = React.useState(true);
  const [returnStatus, setReturnStatus] = React.useState<"RETURNED" | "LOST" | "DAMAGED">("RETURNED");
  const [busy, setBusy] = React.useState(false);

  const loadCopies = React.useCallback(() => {
    bookCopiesApi.list({ limit: 500 }).then((d) => setCopies((d.items as CopyWithBook[]).filter((c) => c.status === "AVAILABLE"))).catch(() => {});
  }, []);
  React.useEffect(() => {
    loadCopies();
    studentsApi.list({ limit: 300 }).then((d) => setStudents(d.items)).catch(() => {});
    teachersApi.list({ limit: 300 }).then((d) => setTeachers(d.items)).catch(() => {});
  }, [loadCopies]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<IssueLoanInput>({ resolver: zodResolver(issueLoanSchema), defaultValues: { borrowerType: "STUDENT" } });
  const borrowerType = watch("borrowerType");

  const openIssue = () => {
    const due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    reset({ borrowerType: "STUDENT", copyId: "", dueDate: due as never });
    setIssueOpen(true);
  };

  const onIssue = async (values: IssueLoanInput) => {
    try {
      await loansApi.create({ ...values, dueDate: new Date(values.dueDate) } as never);
      toast({ variant: "success", title: "Book issued" });
      setIssueOpen(false); list.refresh(); loadCopies();
    } catch (e) { toast({ variant: "destructive", title: "Couldn't issue", description: (e as Error).message }); }
  };

  const openReturn = (loan: BookLoanWithRelations) => {
    setReturnFor(loan); setFine("0"); setFinePaid(true); setReturnStatus("RETURNED");
  };
  const submitReturn = async () => {
    if (!returnFor) return;
    setBusy(true);
    try {
      await request(`/api/loans/${returnFor.id}?action=return`, {
        method: "PATCH",
        body: JSON.stringify({ status: returnStatus, fineAmount: Number(fine) || 0, finePaid }),
      });
      toast({ variant: "success", title: "Loan updated" });
      setReturnFor(null); list.refresh(); loadCopies();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
    finally { setBusy(false); }
  };
  const renew = async (loan: BookLoanWithRelations) => {
    try {
      await request(`/api/loans/${loan.id}?action=renew`, { method: "PATCH", body: JSON.stringify({ days: 7 }) });
      toast({ variant: "success", title: "Renewed for 7 days" });
      list.refresh();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };

  const columns: Column<BookLoanWithRelations>[] = [
    { key: "book", header: t("lib.book"), render: (l) => l.copy?.book?.title ?? "—" },
    { key: "copy", header: t("lib.copy"), render: (l) => <span className="tabular-nums text-xs">{l.copy?.copyCode}</span> },
    { key: "borrower", header: t("lib.borrower"), render: (l) => l.student?.fullName ?? l.teacher?.fullName ?? "—" },
    { key: "issuedAt", header: t("lib.issuedAt"), render: (l) => date(l.issuedAt) },
    { key: "dueDate", header: t("lib.dueDate"), render: (l) => date(l.dueDate) },
    { key: "fine", header: t("lib.fine"), render: (l) => l.fineAmount ? <span className="tabular-nums">{money(l.fineAmount)}</span> : "—" },
    { key: "status", header: t("lib.status"), render: (l) => <Badge variant={loanStatusVariant(l.status)} dot>{l.status}</Badge> },
    { key: "actions", header: "", className: "text-right", render: (l) => (
      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        {l.status === "ISSUED" || l.status === "OVERDUE" ? (
          <>
            <Button variant="ghost" size="icon" onClick={() => renew(l)} aria-label={t("lib.renew")}><RotateCcw className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => openReturn(l)} aria-label={t("lib.return")}><Undo2 className="h-4 w-4" /></Button>
          </>
        ) : <span className="text-xs text-muted-foreground">—</span>}
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title={t("lib.loans")} description={t("lib.subtitle")}
        action={<Button onClick={openIssue}><Plus className="h-4 w-4" /> {t("lib.issueBook")}</Button>} />

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
        rowKey={(l) => l.id}
        filters={
          <TableFilter placeholder={t("lib.status")} value={list.filters.status} onChange={(v) => list.setFilter("status", v)}
            options={[
              { label: "Issued", value: "ISSUED" },
              { label: "Returned", value: "RETURNED" },
              { label: "Overdue", value: "OVERDUE" },
              { label: "Lost", value: "LOST" },
              { label: "Damaged", value: "DAMAGED" },
            ]} />
        }
      />

      {/* Issue dialog */}
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t("lib.issueBook")}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onIssue)} className="space-y-4">
            <Field label={t("lib.copy")} error={errors.copyId?.message} required>
              <Select value={watch("copyId")} onValueChange={(v) => setValue("copyId", v)}>
                <SelectTrigger><SelectValue placeholder={t("lib.selectCopy")} /></SelectTrigger>
                <SelectContent>
                  {copies.length === 0 ? <div className="px-2 py-1.5 text-sm text-muted-foreground">{t("lib.available")}: 0</div> :
                    copies.map((c) => <SelectItem key={c.id} value={c.id}>{c.book?.title} · {c.copyCode}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("lib.borrowerType")} required>
                <Select value={borrowerType} onValueChange={(v) => setValue("borrowerType", v as IssueLoanInput["borrowerType"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="STUDENT">{t("lib.student")}</SelectItem><SelectItem value="TEACHER">{t("lib.teacher")}</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label={t("lib.dueDate")} error={errors.dueDate?.message as string | undefined} required>
                <Input type="date" {...register("dueDate")} />
              </Field>
            </div>
            {borrowerType === "STUDENT" ? (
              <Field label={t("lib.student")} error={errors.studentId?.message} required>
                <Select value={watch("studentId") ?? ""} onValueChange={(v) => setValue("studentId", v)}>
                  <SelectTrigger><SelectValue placeholder={t("opt.selectStudent")} /></SelectTrigger>
                  <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            ) : (
              <Field label={t("lib.teacher")} required>
                <Select value={watch("teacherId") ?? ""} onValueChange={(v) => setValue("teacherId", v)}>
                  <SelectTrigger><SelectValue placeholder={t("opt.selectTeacher")} /></SelectTrigger>
                  <SelectContent>{teachers.map((tc) => <SelectItem key={tc.id} value={tc.id}>{tc.fullName}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIssueOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : t("lib.issueBook")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Return dialog */}
      <Dialog open={!!returnFor} onOpenChange={(o) => !o && setReturnFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t("lib.return")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
              {returnFor?.copy?.book?.title} · {returnFor?.copy?.copyCode}
            </div>
            <Field label={t("lib.status")}>
              <Select value={returnStatus} onValueChange={(v) => setReturnStatus(v as typeof returnStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RETURNED">{t("lib.return")}</SelectItem>
                  <SelectItem value="LOST">{t("lib.markLost")}</SelectItem>
                  <SelectItem value="DAMAGED">{t("lib.markDamaged")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("lib.fine")}>
              <Input type="number" min={0} value={fine} onChange={(e) => setFine(e.target.value)} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={finePaid} onChange={(e) => setFinePaid(e.target.checked)} className="h-4 w-4" />
              {t("lib.finePaid")}
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnFor(null)}>{t("common.cancel")}</Button>
            <Button onClick={submitReturn} disabled={busy}>{busy ? "Saving..." : t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
