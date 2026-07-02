"use client";
import * as React from "react";
import Link from "next/link";
import { BookMarked, BookCopy, Clock, AlertCircle, Coins, ArrowRight, Library as LibraryIcon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { request } from "@/services/api-client";
import { useI18n } from "@/components/i18n-provider";

type Summary = {
  totalBooks: number;
  totalCopies: number;
  activeLoans: number;
  overdue: number;
  finesCollected: number;
  copyStatus: { status: string; count: number }[];
  topCategories: { name: string; count: number }[];
  recentLoans: {
    id: string; status: string; issuedAt: string;
    copy?: { book?: { title: string } | null } | null;
    student?: { fullName: string } | null;
    teacher?: { fullName: string } | null;
  }[];
};

const copyStatusVariant = (s: string) =>
  s === "AVAILABLE" ? "success" : s === "ISSUED" ? "default" : s === "LOST" ? "destructive" : s === "DAMAGED" ? "warning" : "secondary";
const loanStatusVariant = (s: string) =>
  s === "RETURNED" ? "success" : s === "OVERDUE" || s === "LOST" ? "destructive" : s === "DAMAGED" ? "warning" : "default";

export default function LibraryDashboardPage() {
  const { t, num, money, date } = useI18n();
  const [data, setData] = React.useState<Summary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setLoading(true); setError(null);
    request<Summary>("/api/library-summary")
      .then(setData).catch((e) => setError((e as Error).message)).finally(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const kpis = data ? [
    { icon: BookMarked, label: t("lib.totalBooks"), value: num(data.totalBooks), tone: "bg-primary/10 text-primary" },
    { icon: BookCopy, label: t("lib.totalCopies"), value: num(data.totalCopies), tone: "bg-info/12 text-info" },
    { icon: Clock, label: t("lib.activeLoans"), value: num(data.activeLoans), tone: "bg-warning/12 text-warning" },
    { icon: AlertCircle, label: t("lib.overdue"), value: num(data.overdue), tone: "bg-destructive/10 text-destructive" },
    { icon: Coins, label: t("lib.finesCollected"), value: money(data.finesCollected), tone: "bg-success/12 text-success" },
  ] : [];

  return (
    <div>
      <PageHeader
        title={t("lib.title")}
        description={t("lib.subtitle")}
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link href="/dashboard/library/books">{t("lib.catalog")}</Link></Button>
            <Button asChild><Link href="/dashboard/library/loans">{t("lib.loans")} <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : error ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8" /><p>{error}</p>
          <Button variant="outline" onClick={load}>{t("common.tryAgain")}</Button>
        </CardContent></Card>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {kpis.map((k) => {
              const Icon = k.icon;
              return (
                <Card key={k.label}>
                  <CardContent className="flex items-center gap-3 p-5">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${k.tone}`}><Icon className="h-5 w-5" /></div>
                    <div><div className="text-xl font-bold tabular-nums">{k.value}</div><div className="text-xs text-muted-foreground">{k.label}</div></div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>{t("lib.copyStatus")}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.copyStatus.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{t("fin.noData")}</p> :
                  data.copyStatus.map((s) => (
                    <div key={s.status} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                      <Badge variant={copyStatusVariant(s.status)} dot>{s.status}</Badge>
                      <span className="font-medium tabular-nums">{num(s.count)}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t("lib.topCategories")}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.topCategories.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{t("fin.noData")}</p> :
                  data.topCategories.map((c) => (
                    <div key={c.name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                      <span className="flex items-center gap-2"><LibraryIcon className="h-4 w-4 text-primary" /> {c.name}</span>
                      <span className="font-medium tabular-nums">{num(c.count)}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t("lib.recentLoans")}</CardTitle></CardHeader>
              <CardContent className="p-0">
                {data.recentLoans.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">{t("lib.noLoans")}</p> :
                  <div className="divide-y divide-border">
                    {data.recentLoans.map((l) => (
                      <div key={l.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <div className="text-sm font-medium">{l.copy?.book?.title ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{l.student?.fullName ?? l.teacher?.fullName ?? "—"} · {date(l.issuedAt)}</div>
                        </div>
                        <Badge variant={loanStatusVariant(l.status)} dot>{l.status}</Badge>
                      </div>
                    ))}
                  </div>}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
