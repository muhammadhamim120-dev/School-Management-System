"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Trash2, CreditCard, Receipt, X } from "lucide-react";
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
import { invoicesApi, paymentsApi, studentsApi, feeCategoriesApi } from "@/services/resources";
import { request } from "@/services/api-client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import { computeInvoiceTotals } from "@/lib/finance";
import type { InvoiceWithRelations, StudentWithRelations, FeeCategory } from "@/types";

const statusVariant = (s: string) =>
  s === "PAID" ? "success" : s === "OVERDUE" ? "destructive" : s === "PARTIAL" ? "warning" : s === "CANCELLED" ? "secondary" : "default";

type DraftItem = { categoryId: string; description: string; amount: string; discount: string };

export default function InvoicesPage() {
  return (
    <React.Suspense fallback={null}>
      <InvoicesPageInner />
    </React.Suspense>
  );
}

function InvoicesPageInner() {
  const { toast } = useToast();
  const { t, money, date } = useI18n();
  const searchParams = useSearchParams();
  const list = useResourceList<InvoiceWithRelations>(invoicesApi.list);

  const [students, setStudents] = React.useState<StudentWithRelations[]>([]);
  const [categories, setCategories] = React.useState<FeeCategory[]>([]);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [studentId, setStudentId] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [period, setPeriod] = React.useState("");
  const [items, setItems] = React.useState<DraftItem[]>([{ categoryId: "", description: "", amount: "", discount: "0" }]);
  const [saving, setSaving] = React.useState(false);

  const [payFor, setPayFor] = React.useState<InvoiceWithRelations | null>(null);
  const [payAmount, setPayAmount] = React.useState("");
  const [payMethod, setPayMethod] = React.useState("CASH");
  const [payRef, setPayRef] = React.useState("");
  const [payLoading, setPayLoading] = React.useState(false);

  const [deleting, setDeleting] = React.useState<InvoiceWithRelations | null>(null);

  React.useEffect(() => {
    studentsApi.list({ limit: 200 }).then((d) => setStudents(d.items)).catch(() => {});
    feeCategoriesApi.list({ limit: 100 }).then((d) => setCategories(d.items)).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (searchParams.get("new") === "1") setCreateOpen(true);
  }, [searchParams]);

  const totals = computeInvoiceTotals(items.map((i) => ({ amount: Number(i.amount) || 0, discount: Number(i.discount) || 0 })));

  const resetCreate = () => {
    setStudentId(""); setDueDate(""); setPeriod("");
    setItems([{ categoryId: "", description: "", amount: "", discount: "0" }]);
  };

  const addItem = () => setItems((prev) => [...prev, { categoryId: "", description: "", amount: "", discount: "0" }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const createInvoice = async () => {
    if (!studentId || !dueDate || items.some((i) => !i.description || !i.amount)) {
      toast({ variant: "destructive", title: t("toast.missingFields"), description: t("toast.missingFieldsDesc") });
      return;
    }
    setSaving(true);
    try {
      await invoicesApi.create({
        studentId,
        dueDate: new Date(dueDate) as never,
        period: period || undefined,
        items: items.map((i) => ({
          categoryId: i.categoryId || undefined,
          description: i.description,
          amount: Number(i.amount),
          discount: Number(i.discount) || 0,
        })),
      } as never);
      toast({ variant: "success", title: t("toast.invoiceCreated") });
      setCreateOpen(false); resetCreate(); list.refresh();
    } catch (e) {
      toast({ variant: "destructive", title: t("toast.couldNotCreate"), description: (e as Error).message });
    } finally { setSaving(false); }
  };

  const openPay = (inv: InvoiceWithRelations) => {
    setPayFor(inv);
    const due = (inv.total ?? 0) - (inv.paidTotal ?? 0);
    setPayAmount(due > 0 ? String(due) : "");
    setPayMethod("CASH"); setPayRef("");
  };

  const recordPayment = async () => {
    if (!payFor || !payAmount) return;
    setPayLoading(true);
    try {
      const gateway = ["BKASH", "NAGAD", "ROCKET", "SSLCOMMERZ"].includes(payMethod) ? payMethod : undefined;
      await paymentsApi.create({
        invoiceId: payFor.id,
        amount: Number(payAmount),
        method: payMethod as never,
        gateway: gateway as never,
        gatewayRef: payRef || undefined,
      } as never);
      toast({ variant: "success", title: t("toast.paymentRecorded") });
      setPayFor(null); list.refresh();
    } catch (e) {
      toast({ variant: "destructive", title: t("toast.couldNotRecord"), description: (e as Error).message });
    } finally { setPayLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await request(`/api/invoices/${deleting.id}`, { method: "DELETE" });
      toast({ variant: "success", title: t("toast.invoiceDeleted") });
      setDeleting(null); list.refresh();
    } catch (e) {
      toast({ variant: "destructive", title: t("toast.couldNotDelete"), description: (e as Error).message });
    }
  };

  const columns: Column<InvoiceWithRelations>[] = [
    { key: "invoiceNo", header: t("fin.invoiceNo"), render: (i) => <span className="font-medium tabular-nums">{i.invoiceNo}</span> },
    { key: "student", header: t("fin.student"), render: (i) => i.student?.fullName ?? "—" },
    { key: "total", header: t("fin.total"), render: (i) => <span className="tabular-nums">{money(i.total)}</span> },
    { key: "paid", header: t("fin.paid"), render: (i) => <span className="tabular-nums text-success">{money(i.paidTotal)}</span> },
    { key: "due", header: t("fin.due"), render: (i) => <span className="tabular-nums">{money((i.total ?? 0) - (i.paidTotal ?? 0))}</span> },
    { key: "dueDate", header: t("fin.dueDate"), render: (i) => date(i.dueDate) },
    { key: "status", header: t("col.status"), render: (i) => <Badge variant={statusVariant(i.status)} dot>{i.status}</Badge> },
    {
      key: "actions", header: "", className: "text-right",
      render: (i) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => openPay(i)} aria-label="Record payment" disabled={i.status === "PAID" || i.status === "CANCELLED"}>
            <CreditCard className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(i)} aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("fin.invoices")}
        description={t("fin.subtitle")}
        action={<Button onClick={() => { resetCreate(); setCreateOpen(true); }}><Plus className="h-4 w-4" /> {t("fin.newInvoice")}</Button>}
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
        searchPlaceholder={t("fin.searchPlaceholder")}
        rowKey={(i) => i.id}
        filters={
          <TableFilter
            placeholder={t("fin.byStatus")} value={list.filters.status}
            onChange={(v) => list.setFilter("status", v)}
            options={[
              { label: t("inv.status.ISSUED"), value: "ISSUED" },
              { label: t("inv.status.PARTIAL"), value: "PARTIAL" },
              { label: t("inv.status.PAID"), value: "PAID" },
              { label: t("inv.status.OVERDUE"), value: "OVERDUE" },
              { label: t("inv.status.CANCELLED"), value: "CANCELLED" },
            ]}
          />
        }
      />

      {/* Create invoice dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t("fin.newInvoice")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label={t("fin.student")} required>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger><SelectValue placeholder={t("opt.selectStudent")} /></SelectTrigger>
                  <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label={t("fin.dueDate")} required><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
              <Field label={t("fin.period")}><Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2025-01" /></Field>
            </div>

            {/* Line items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("fin.description")}</span>
                <Button type="button" variant="ghost" size="sm" onClick={addItem}><Plus className="h-3.5 w-3.5" /> {t("fin.addItem")}</Button>
              </div>
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 items-end gap-2 rounded-lg border border-border p-2">
                  <div className="col-span-3">
                    <Select value={it.categoryId} onValueChange={(v) => updateItem(idx, { categoryId: v })}>
                      <SelectTrigger className="h-9"><SelectValue placeholder={t("fin.category")} /></SelectTrigger>
                      <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4"><Input placeholder={t("fin.description")} value={it.description} onChange={(e) => updateItem(idx, { description: e.target.value })} /></div>
                  <div className="col-span-2"><Input type="number" min={0} placeholder={t("fin.amount")} value={it.amount} onChange={(e) => updateItem(idx, { amount: e.target.value })} /></div>
                  <div className="col-span-2"><Input type="number" min={0} placeholder={t("fin.discount")} value={it.discount} onChange={(e) => updateItem(idx, { discount: e.target.value })} /></div>
                  <div className="col-span-1 flex justify-end">
                    {items.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)}><X className="h-4 w-4" /></Button>}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="flex justify-end gap-6 rounded-lg bg-muted/40 px-4 py-3 text-sm">
              <div>{t("fin.subtotal")}: <span className="font-medium tabular-nums">{money(totals.subtotal)}</span></div>
              <div>{t("fin.discount")}: <span className="font-medium tabular-nums">{money(totals.discountTotal)}</span></div>
              <div>{t("fin.total")}: <span className="font-bold tabular-nums">{money(totals.total)}</span></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={createInvoice} disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record payment dialog */}
      <Dialog open={!!payFor} onOpenChange={(o) => !o && setPayFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t("fin.recordPayment")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <div className="flex items-center gap-2"><Receipt className="h-4 w-4 text-muted-foreground" /> {payFor?.invoiceNo} · {payFor?.student?.fullName}</div>
              <div className="mt-1 text-muted-foreground">{t("fin.due")}: <span className="tabular-nums">{money((payFor?.total ?? 0) - (payFor?.paidTotal ?? 0))}</span></div>
            </div>
            <Field label={t("fin.amount")} required><Input type="number" min={0} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} /></Field>
            <Field label={t("fin.method")}>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["CASH", "BANK", "BKASH", "NAGAD", "ROCKET", "SSLCOMMERZ", "CARD", "CHEQUE", "OTHER"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fin.referenceTxn")}><Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="e.g. bKash TrxID" /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayFor(null)}>{t("common.cancel")}</Button>
            <Button onClick={recordPayment} disabled={payLoading}>{payLoading ? t("common.saving") : t("fin.recordPayment")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}
        title={t("fin.deleteTitle")} description={t("fin.deleteDescription")} onConfirm={handleDelete}
      />
    </div>
  );
}
