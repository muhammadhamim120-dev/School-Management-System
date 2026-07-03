"use client";
import * as React from "react";
import { Wallet, RotateCcw, Receipt, CheckCircle2, XCircle, Copy, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { TableFilter } from "@/components/dashboard/table-filter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/form-field";
import { useResourceList } from "@/hooks/use-resource-list";
import { request } from "@/services/api-client";
import { paymentTransactionsApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import type { PaymentTransaction } from "@/types";

type Availability = { id: string; configured: boolean; requiredEnv: string[] };
type RecentPayment = {
  id: string; amount: number; refundedAmount: number; method: string; status: string; gateway: string | null; gatewayRef: string | null; createdAt: string;
  invoice?: { invoiceNo: string; student?: { fullName: string } | null } | null;
};
type Summary = {
  grossCollected: number; netCollected: number; refunded: number;
  byGateway: { gateway: string | null; amount: number; count: number }[];
  byStatus: { status: string; count: number }[];
  recent: RecentPayment[];
  availability: Availability[];
};

const payStatusVariant = (s: string) => (s === "SUCCESS" ? "success" : s === "FAILED" ? "destructive" : s === "REFUNDED" ? "warning" : "secondary");

export default function PaymentsPage() {
  const { t, num, money } = useI18n();
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const load = React.useCallback(() => {
    setLoading(true);
    request<Summary>("/api/payments-summary").then(setSummary).catch(() => setSummary(null)).finally(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const kpis = summary ? [
    { icon: Wallet, label: t("pay.grossCollected"), value: money(summary.grossCollected), tone: "bg-primary/10 text-primary" },
    { icon: CheckCircle2, label: t("pay.netCollected"), value: money(summary.netCollected), tone: "bg-success/12 text-success" },
    { icon: TrendingDown, label: t("pay.refunded"), value: money(summary.refunded), tone: "bg-warning/12 text-warning" },
  ] : [];

  return (
    <div>
      <PageHeader title={t("pay.title")} description={t("pay.subtitle")} />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : summary ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {kpis.map((k) => { const Icon = k.icon; return (
            <Card key={k.label}><CardContent className="flex items-center gap-3 p-5">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${k.tone}`}><Icon className="h-5 w-5" /></div>
              <div><div className="text-xl font-bold tabular-nums">{k.value}</div><div className="text-xs text-muted-foreground">{k.label}</div></div>
            </CardContent></Card>
          ); })}
        </div>
      ) : null}

      <div className="mt-6">
        <Tabs defaultValue="history">
          <TabsList>
            <TabsTrigger value="history">{t("pay.history")}</TabsTrigger>
            <TabsTrigger value="logs">{t("pay.logs")}</TabsTrigger>
            <TabsTrigger value="settings">{t("pay.settings")}</TabsTrigger>
          </TabsList>
          <TabsContent value="history" className="mt-4"><HistoryTab summary={summary} onChange={load} /></TabsContent>
          <TabsContent value="logs" className="mt-4"><LogsTab /></TabsContent>
          <TabsContent value="settings" className="mt-4"><SettingsTab availability={summary?.availability ?? []} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function HistoryTab({ summary, onChange }: { summary: Summary | null; onChange: () => void }) {
  const { t, num, money, date } = useI18n();
  const { toast } = useToast();
  const [refundFor, setRefundFor] = React.useState<RecentPayment | null>(null);
  const [refundAmount, setRefundAmount] = React.useState("");
  const [refundReason, setRefundReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const rows = summary?.recent ?? [];
  const openRefund = (p: RecentPayment) => {
    const refundable = p.amount - (p.refundedAmount ?? 0);
    setRefundFor(p); setRefundAmount(String(refundable)); setRefundReason("");
  };
  const submitRefund = async () => {
    if (!refundFor) return;
    setBusy(true);
    try {
      await request("/api/payments/refund", { method: "POST", body: JSON.stringify({ paymentId: refundFor.id, amount: Number(refundAmount), reason: refundReason || undefined }) });
      toast({ variant: "success", title: "Refund processed" });
      setRefundFor(null); onChange();
    } catch (e) { toast({ variant: "destructive", title: "Refund failed", description: (e as Error).message }); }
    finally { setBusy(false); }
  };
  const downloadReceipt = (p: RecentPayment) => { window.open(`/api/payments/${p.id}/receipt`, "_blank"); };

  const columns: Column<RecentPayment>[] = [
    { key: "student", header: t("pay.student"), render: (p) => p.invoice?.student?.fullName ?? "—" },
    { key: "invoice", header: t("pay.invoice"), render: (p) => <span className="tabular-nums text-xs">{p.invoice?.invoiceNo ?? "—"}</span> },
    { key: "amount", header: t("pay.amount"), render: (p) => (
      <div><span className="tabular-nums font-medium">{money(p.amount)}</span>{(p.refundedAmount ?? 0) > 0 && <div className="text-xs text-warning">-{money(p.refundedAmount)}</div>}</div>
    ) },
    { key: "method", header: t("pay.method"), render: (p) => <Badge variant="secondary">{p.gateway ?? p.method}</Badge> },
    { key: "ref", header: t("pay.ref"), render: (p) => <span className="tabular-nums text-xs text-muted-foreground">{p.gatewayRef ?? "—"}</span> },
    { key: "status", header: t("pay.status"), render: (p) => <Badge variant={payStatusVariant(p.status)} dot>{p.status}</Badge> },
    { key: "date", header: t("pay.date"), render: (p) => date(p.createdAt) },
    { key: "actions", header: "", className: "text-right", render: (p) => (
      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" onClick={() => downloadReceipt(p)} aria-label={t("pay.receipt")}><Receipt className="h-4 w-4" /></Button>
        {(p.status === "SUCCESS" || p.status === "REFUNDED") && (p.amount - (p.refundedAmount ?? 0)) > 0 && (
          <Button variant="ghost" size="icon" onClick={() => openRefund(p)} aria-label={t("pay.refund")}><RotateCcw className="h-4 w-4" /></Button>
        )}
      </div>
    ) },
  ];
  return (
    <div>
      {summary && summary.byGateway.length > 0 && (
        <Card className="mb-4">
          <CardHeader><CardTitle className="text-sm">{t("pay.byGateway")}</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {summary.byGateway.map((g) => (
              <div key={g.gateway} className="rounded-lg border border-border px-4 py-2">
                <div className="text-xs text-muted-foreground">{g.gateway}</div>
                <div className="font-semibold tabular-nums">{money(g.amount)}</div>
                <div className="text-xs text-muted-foreground">{num(g.count)} txn</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {rows.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">{t("pay.noPayments")}</CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
                {columns.map((c) => <th key={c.key} className={`px-4 py-2 ${c.className ?? ""}`}>{c.header}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {rows.map((p) => (
                  <tr key={p.id}>{columns.map((c) => <td key={c.key} className={`px-4 py-2.5 ${c.className ?? ""}`}>{c.render?.(p)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      )}

      <Dialog open={!!refundFor} onOpenChange={(o) => !o && setRefundFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t("pay.processRefund")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {refundFor && <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
              {refundFor.invoice?.student?.fullName} · {money(refundFor.amount)} · {t("pay.refundable")}: {money(refundFor.amount - (refundFor.refundedAmount ?? 0))}
            </div>}
            <Field label={t("pay.refundAmount")}><Input type="number" min={0} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} /></Field>
            <Field label={t("pay.refundReason")}><Input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundFor(null)}>{t("common.cancel")}</Button>
            <Button onClick={submitRefund} disabled={busy}>{busy ? "Processing..." : t("pay.processRefund")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LogsTab() {
  const { t, num, money, date } = useI18n();
  const list = useResourceList<PaymentTransaction>(paymentTransactionsApi.list);
  const columns: Column<PaymentTransaction>[] = [
    { key: "event", header: t("pay.event"), render: (r) => <Badge variant="secondary">{r.event}</Badge> },
    { key: "gateway", header: t("pay.gateway"), render: (r) => r.gateway ?? "—" },
    { key: "ref", header: t("pay.ref"), render: (r) => <span className="tabular-nums text-xs">{r.gatewayRef ?? "—"}</span> },
    { key: "amount", header: t("pay.amount"), render: (r) => r.amount != null ? <span className="tabular-nums">{money(r.amount)}</span> : "—" },
    { key: "status", header: t("pay.status"), render: (r) => <Badge variant={payStatusVariant(r.status)} dot>{r.status}</Badge> },
    { key: "message", header: t("pay.message"), render: (r) => <span className="text-xs text-muted-foreground">{r.message ?? "—"}</span> },
    { key: "date", header: t("pay.date"), render: (r) => date(r.createdAt) },
  ];
  return (
    <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} total={list.total}
      page={list.page} totalPages={list.totalPages} search={list.search} onSearch={list.onSearch} onPage={list.setPage}
      onRetry={list.refresh} rowKey={(r) => r.id} searchPlaceholder="Search reference…"
      filters={
        <>
          <TableFilter placeholder={t("pay.event")} value={list.filters.event} onChange={(v) => list.setFilter("event", v)}
            options={["INITIATE","CALLBACK","WEBHOOK","VERIFY","REFUND","MANUAL"].map((e) => ({ label: e, value: e }))} />
          <TableFilter placeholder={t("pay.gateway")} value={list.filters.gateway} onChange={(v) => list.setFilter("gateway", v)}
            options={["BKASH","NAGAD","ROCKET","SSLCOMMERZ"].map((g) => ({ label: g, value: g }))} />
        </>
      }
      activeFilterCount={list.activeFilterCount} onClearFilters={list.clearFilters} />
  );
}

function SettingsTab({ availability }: { availability: Availability[] }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [origin, setOrigin] = React.useState("");
  React.useEffect(() => { setOrigin(window.location.origin); }, []);
  const copy = (text: string) => { navigator.clipboard?.writeText(text); toast({ variant: "success", title: "Copied" }); };
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">{t("pay.settingsNote")}</div>
      <div className="grid gap-4 md:grid-cols-2">
        {availability.map((g) => {
          const hook = `${origin}/api/payments/webhook/${g.id.toLowerCase()}`;
          const cb = `${origin}/api/payments/callback/${g.id.toLowerCase()}`;
          return (
            <Card key={g.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{g.id}</CardTitle>
                {g.configured
                  ? <span className="flex items-center gap-1 text-sm text-success"><CheckCircle2 className="h-4 w-4" /> {t("pay.configured")}</span>
                  : <span className="flex items-center gap-1 text-sm text-muted-foreground"><XCircle className="h-4 w-4" /> {t("pay.notConfigured")}</span>}
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">{t("pay.requiredEnv")}</div>
                  <div className="flex flex-wrap gap-1">{g.requiredEnv.map((e) => <code key={e} className="rounded bg-muted px-1.5 py-0.5 text-xs">{e}</code>)}</div>
                </div>
                <UrlRow label={t("pay.webhookUrl")} url={hook} onCopy={copy} />
                <UrlRow label={t("pay.callbackUrl")} url={cb} onCopy={copy} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function UrlRow({ label, url, onCopy }: { label: string; url: string; onCopy: (t: string) => void }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">{url}</code>
        <Button variant="ghost" size="icon" onClick={() => onCopy(url)}><Copy className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}
