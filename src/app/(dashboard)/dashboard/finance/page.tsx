"use client";
import * as React from "react";
import Link from "next/link";
import { Wallet, TrendingUp, AlertCircle, Receipt, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { request } from "@/services/api-client";
import { useI18n } from "@/components/i18n-provider";

type Summary = {
  billed: number;
  collected: number;
  outstanding: number;
  byStatus: { status: string; count: number; total: number; paid: number }[];
  monthly: { month: string; total: number }[];
  recentPayments: {
    id: string; amount: number; method: string; receivedAt: string;
    invoice?: { invoiceNo: string; student?: { fullName: string } | null } | null;
  }[];
  gateways: { id: string; configured: boolean }[];
};

const statusVariant = (s: string) =>
  s === "PAID" ? "success" : s === "OVERDUE" ? "destructive" : s === "PARTIAL" ? "warning" : s === "CANCELLED" ? "secondary" : "default";

export default function FinanceDashboardPage() {
  const { t, money, num, date } = useI18n();
  const [data, setData] = React.useState<Summary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setLoading(true); setError(null);
    request<Summary>("/api/finance-summary")
      .then(setData).catch((e) => setError((e as Error).message)).finally(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const chartData = (data?.monthly ?? []).map((m) => ({ month: m.month, total: Math.round(m.total) }));

  return (
    <div>
      <PageHeader
        title={t("fin.title")}
        description={t("fin.subtitle")}
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link href="/dashboard/finance/setup">{t("fin.setup")}</Link></Button>
            <Button variant="outline" asChild><Link href="/dashboard/finance/concessions">{t("fin.concessions")}</Link></Button>
            <Button variant="outline" asChild><Link href="/dashboard/finance/invoices">{t("fin.invoices")}</Link></Button>
            <Button asChild><Link href="/dashboard/finance/invoices?new=1">{t("fin.newInvoice")} <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : error ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8" /><p>{error}</p>
          <Button variant="outline" onClick={load}>{t("common.tryAgain")}</Button>
        </CardContent></Card>
      ) : data ? (
        <>
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Receipt className="h-5 w-5" /></div>
                <div><div className="text-2xl font-bold tabular-nums">{money(data.billed)}</div><div className="text-sm text-muted-foreground">{t("fin.totalBilled")}</div></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/12 text-success"><TrendingUp className="h-5 w-5" /></div>
                <div><div className="text-2xl font-bold tabular-nums">{money(data.collected)}</div><div className="text-sm text-muted-foreground">{t("fin.collected")}</div></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><AlertCircle className="h-5 w-5" /></div>
                <div><div className="text-2xl font-bold tabular-nums">{money(data.outstanding)}</div><div className="text-sm text-muted-foreground">{t("fin.outstanding")}</div></div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {/* Revenue chart */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>{t("fin.monthlyRevenue")}</CardTitle></CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">{t("fin.noData")}</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                        formatter={(v: number) => money(v)}
                      />
                      <Bar dataKey="total" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} name={t("fin.collected")} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Status breakdown */}
            <Card>
              <CardHeader><CardTitle>{t("fin.byStatus")}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.byStatus.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">{t("fin.noData")}</p>
                ) : data.byStatus.map((s) => (
                  <div key={s.status} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <Badge variant={statusVariant(s.status)} dot>{s.status}</Badge>
                    <div className="text-right text-sm">
                      <div className="font-medium tabular-nums">{money(s.total)}</div>
                      <div className="text-xs text-muted-foreground">{num(s.count)} {t("fin.invoicesLc")}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {/* Recent payments */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>{t("fin.recentPayments")}</CardTitle></CardHeader>
              <CardContent className="p-0">
                {data.recentPayments.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">{t("fin.noData")}</p>
                ) : (
                  <div className="divide-y divide-border">
                    {data.recentPayments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <div className="text-sm font-medium">{p.invoice?.student?.fullName ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{p.invoice?.invoiceNo} · {p.method} · {date(p.receivedAt)}</div>
                        </div>
                        <div className="font-medium tabular-nums text-success">{money(p.amount)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gateway availability */}
            <Card>
              <CardHeader><CardTitle>{t("fin.gateways")}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.gateways.map((g) => (
                  <div key={g.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                    <span className="font-medium">{g.id}</span>
                    {g.configured ? (
                      <span className="flex items-center gap-1 text-success"><CheckCircle2 className="h-4 w-4" /> {t("fin.configured")}</span>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground"><XCircle className="h-4 w-4" /> {t("fin.notConfigured")}</span>
                    )}
                  </div>
                ))}
                <p className="pt-1 text-xs text-muted-foreground">{t("fin.gatewayHint")}</p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
