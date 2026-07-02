"use client";
import * as React from "react";
import { Activity, AlertTriangle, TrendingUp, RefreshCw, Info } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { TableFilter } from "@/components/dashboard/table-filter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useResourceList } from "@/hooks/use-resource-list";
import { request } from "@/services/api-client";
import { riskAssessmentsApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages";
import type { RiskAssessmentWithStudent } from "@/types";

const levelVariant = (l: string) => (l === "HIGH" ? "destructive" : l === "MEDIUM" ? "warning" : "success");

type Summary = {
  total: number; avgScore: number; lastComputed: string | null;
  levels: { level: string; count: number }[];
  topRisk: { id: string; score: number; level: string; factors: string | null; student?: { fullName: string; class?: { name: string } | null } | null }[];
};

export default function RiskPage() {
  const { t, num, date } = useI18n();
  const { toast } = useToast();
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [computing, setComputing] = React.useState(false);
  const list = useResourceList<RiskAssessmentWithStudent>(riskAssessmentsApi.list);

  const loadSummary = React.useCallback(() => {
    setLoading(true);
    request<Summary>("/api/risk-summary").then(setSummary).catch(() => setSummary(null)).finally(() => setLoading(false));
  }, []);
  React.useEffect(() => { loadSummary(); }, [loadSummary]);

  const recompute = async () => {
    setComputing(true);
    try {
      const res = await request<{ computed: number }>("/api/risk-compute", { method: "POST" });
      toast({ variant: "success", title: `Computed ${res.computed} assessments` });
      loadSummary(); list.refresh();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
    finally { setComputing(false); }
  };

  const levelCount = (lvl: string) => summary?.levels.find((l) => l.level === lvl)?.count ?? 0;
  const kpis = summary ? [
    { icon: Activity, label: t("risk.total"), value: num(summary.total), tone: "bg-primary/10 text-primary" },
    { icon: TrendingUp, label: t("risk.avgScore"), value: num(summary.avgScore), tone: "bg-info/12 text-info" },
    { icon: AlertTriangle, label: t("risk.high"), value: num(levelCount("HIGH")), tone: "bg-destructive/10 text-destructive" },
    { icon: Activity, label: t("risk.medium"), value: num(levelCount("MEDIUM")), tone: "bg-warning/12 text-warning" },
  ] : [];

  const columns: Column<RiskAssessmentWithStudent>[] = [
    { key: "student", header: t("risk.student"), render: (r) => <span className="font-medium">{r.student?.fullName ?? "—"}</span> },
    { key: "class", header: t("risk.class"), render: (r) => r.student?.class?.name ?? "—" },
    { key: "score", header: t("risk.score"), render: (r) => <span className="tabular-nums font-semibold">{num(Math.round(r.score))}</span> },
    { key: "level", header: t("risk.level"), render: (r) => <Badge variant={levelVariant(r.level)} dot>{t(`risk.lvl.${r.level}` as MessageKey)}</Badge> },
    { key: "attendance", header: t("risk.attendance"), render: (r) => r.attendanceRate !== null && r.attendanceRate !== undefined ? `${num(Math.round(r.attendanceRate))}%` : "—" },
    { key: "factors", header: t("risk.factors"), render: (r) => <span className="text-xs text-muted-foreground">{r.factors ?? "—"}</span> },
  ];

  return (
    <div>
      <PageHeader title={t("risk.title")} description={t("risk.subtitle")}
        action={<Button onClick={recompute} disabled={computing}><RefreshCw className={`h-4 w-4 ${computing ? "animate-spin" : ""}`} /> {computing ? t("risk.computing") : t("risk.compute")}</Button>} />

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{t("risk.methodNote")}</span>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => { const Icon = k.icon; return (
              <Card key={k.label}><CardContent className="flex items-center gap-3 p-5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${k.tone}`}><Icon className="h-5 w-5" /></div>
                <div><div className="text-xl font-bold tabular-nums">{k.value}</div><div className="text-xs text-muted-foreground">{k.label}</div></div>
              </CardContent></Card>
            ); })}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {t("risk.lastComputed")}: {summary.lastComputed ? date(summary.lastComputed) : t("risk.never")}
          </div>

          {summary.topRisk.length > 0 && (
            <Card className="mt-4">
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-destructive" /> {t("risk.topRisk")}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {summary.topRisk.map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <div className="font-medium">{r.student?.fullName ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{r.student?.class?.name ?? "—"} · {r.factors ?? ""}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums font-bold text-destructive">{num(Math.round(r.score))}</span>
                        <Badge variant={levelVariant(r.level)} dot>{t(`risk.lvl.${r.level}` as MessageKey)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}

      <div className="mt-6">
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
          onRetry={list.refresh}
          rowKey={(r) => r.id}
          searchPlaceholder="Search student…"
          filters={
            <TableFilter placeholder={t("risk.level")} value={list.filters.level} onChange={(v) => list.setFilter("level", v)}
              options={[
                { label: t("risk.lvl.HIGH"), value: "HIGH" },
                { label: t("risk.lvl.MEDIUM"), value: "MEDIUM" },
                { label: t("risk.lvl.LOW"), value: "LOW" },
              ]} />
          }
          activeFilterCount={list.activeFilterCount}
          onClearFilters={list.clearFilters}
        />
      </div>
    </div>
  );
}
