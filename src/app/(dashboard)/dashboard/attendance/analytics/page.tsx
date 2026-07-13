"use client";
import * as React from "react";
import { Download, TrendingUp, BarChart3, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { request } from "@/services/api-client";
import { useI18n } from "@/components/i18n-provider";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts";

type Analytics = {
  month: string;
  overall: { rate: number; total: number; PRESENT: number; LATE: number; ABSENT: number; EXCUSED: number };
  daily: { date: string; rate: number }[];
  byClass: { className: string; rate: number; count: number }[];
  monthly: { studentId: string; name: string; className: string; present: number; late: number; absent: number; excused: number; rate: number }[];
};

export default function AttendanceAnalyticsPage() {
  const { t, num } = useI18n();
  const [month, setMonth] = React.useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = React.useState<Analytics | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback((m: string) => {
    setLoading(true);
    request<Analytics>(`/api/attendance/analytics?month=${m}`).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(month); }, [month, load]);

  const kpis = data ? [
    { label: t("att.rate"), value: `${num(data.overall.rate)}%`, icon: TrendingUp },
    { label: t("att.presentDays"), value: num(data.overall.PRESENT), icon: CalendarDays },
    { label: t("att.lateDays"), value: num(data.overall.LATE), icon: CalendarDays },
    { label: t("att.absentDays"), value: num(data.overall.ABSENT), icon: CalendarDays },
  ] : [];

  const exportCsv = () => {
    if (!data) return;
    const header = ["Student ID", "Name", "Class", "Present", "Late", "Absent", "Excused", "Rate %"];
    const rows = data.monthly.map((s) => [s.studentId, s.name, s.className, s.present, s.late, s.absent, s.excused, s.rate]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${data.month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title={t("att.analytics")}
        description={t("att.monthlyReport")}
        action={
          <div className="flex items-center gap-2">
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-[160px]" />
            <Button variant="outline" onClick={exportCsv} disabled={!data || data.monthly.length === 0}>
              <Download className="h-4 w-4" /> {t("att.export")}
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => { const Icon = k.icon; return (
              <Card key={k.label}><CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                <div><div className="text-xl font-bold tabular-nums">{k.value}</div><div className="text-xs text-muted-foreground">{k.label}</div></div>
              </CardContent></Card>
            ); })}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><TrendingUp className="h-4 w-4" /> {t("att.last14")}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={data.daily}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><BarChart3 className="h-4 w-4" /> {t("att.byClass")}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.byClass}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="className" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-sm">{t("att.monthlyReport")} — {data.month}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/60 text-left">
                      <tr>
                        <th className="px-3 py-2 font-medium">{t("att.student")}</th>
                        <th className="px-3 py-2 font-medium">{t("page.classes.title")}</th>
                        <th className="px-3 py-2 text-right font-medium">{t("att.presentDays")}</th>
                        <th className="px-3 py-2 text-right font-medium">{t("att.lateDays")}</th>
                        <th className="px-3 py-2 text-right font-medium">{t("att.absentDays")}</th>
                        <th className="px-3 py-2 text-right font-medium">{t("att.rate")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.monthly.map((s) => (
                        <tr key={s.studentId} className="border-t">
                          <td className="px-3 py-2"><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.studentId}</div></td>
                          <td className="px-3 py-2">{s.className}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{num(s.present)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{num(s.late)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{num(s.absent)}</td>
                          <td className="px-3 py-2 text-right"><Badge variant={s.rate >= 75 ? "success" : s.rate >= 50 ? "warning" : "destructive"}>{num(s.rate)}%</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
