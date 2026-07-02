"use client";
import * as React from "react";
import { CalendarCheck, GraduationCap, Wallet, Bus, BedDouble, Bell, User } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { request } from "@/services/api-client";
import { studentsApi } from "@/services/resources";
import { useI18n } from "@/components/i18n-provider";
import { computeGpa, formatGpa } from "@/lib/grading";
import type { StudentWithRelations } from "@/types";

type Portal = {
  student: { id: string; name: string; roll: string | null; photo: string | null; class: string | null; section: string | null; parent: { name: string; phone: string | null } | null };
  attendance: { summary: Record<string, number>; totalDays: number; rate: number | null };
  results: { id: string; marks: number; totalMarks: number; grade: string | null; exam?: { name: string } | null; subject?: { name: string } | null }[];
  invoices: { id: string; invoiceNo: string; total: number; paidTotal: number; status: string }[];
  outstanding: number;
  transport: { id: string; route?: { name: string } | null; stop?: { name: string } | null }[];
  hostel: { id: string; room?: { roomNo: string; building?: { name: string } | null } | null }[];
  notices: { id: string; title: string; content: string; pinned: boolean; createdAt: string }[];
};

const invStatusVariant = (s: string) => (s === "PAID" ? "success" : s === "OVERDUE" ? "destructive" : s === "PARTIAL" ? "warning" : "secondary");

export default function ParentPortalPage() {
  const { t, num, money, date } = useI18n();
  const [students, setStudents] = React.useState<StudentWithRelations[]>([]);
  const [studentId, setStudentId] = React.useState("");
  const [data, setData] = React.useState<Portal | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => { studentsApi.list({ limit: 500 }).then((d) => setStudents(d.items)).catch(() => {}); }, []);
  React.useEffect(() => {
    if (!studentId) { setData(null); return; }
    setLoading(true);
    request<Portal>(`/api/parent-portal/${studentId}`).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [studentId]);

  // Latest exam GPA from the most recent exam's subject results.
  const gpaLine = React.useMemo(() => {
    if (!data || data.results.length === 0) return null;
    const latestExam = data.results[0]?.exam?.name;
    const subjects = data.results.filter((r) => r.exam?.name === latestExam).map((r) => ({ percentage: (r.marks / (r.totalMarks || 100)) * 100 }));
    if (subjects.length === 0) return null;
    const g = computeGpa(subjects);
    return { exam: latestExam, gpa: formatGpa(g.gpa), grade: g.overallGrade };
  }, [data]);

  return (
    <div>
      <PageHeader title={t("pp.title")} description={t("pp.subtitle")} />

      <div className="mb-6 max-w-sm">
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger><SelectValue placeholder={t("pp.selectChild")} /></SelectTrigger>
          <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.fullName}{s.rollNumber ? ` · ${s.rollNumber}` : ""}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {!studentId ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
          <User className="h-10 w-10 opacity-40" /><p>{t("pp.noChild")}</p>
        </CardContent></Card>
      ) : loading ? (
        <div className="grid gap-4 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : data ? (
        <div className="space-y-4">
          {/* Student header */}
          <Card>
            <CardContent className="flex flex-wrap items-center gap-4 p-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {data.student.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold">{data.student.name}</div>
                <div className="text-sm text-muted-foreground">
                  {t("pp.class")}: {data.student.class ?? "—"}{data.student.section ? ` (${data.student.section})` : ""} · {t("pp.roll")}: {data.student.roll ?? "—"}
                </div>
                {data.student.parent && <div className="text-xs text-muted-foreground">{t("pp.guardian")}: {data.student.parent.name}{data.student.parent.phone ? ` · ${data.student.parent.phone}` : ""}</div>}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Attendance */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><CalendarCheck className="h-4 w-4 text-primary" /> {t("pp.attendance")}</CardTitle></CardHeader>
              <CardContent>
                <div className="mb-3 text-3xl font-bold tabular-nums">{data.attendance.rate !== null ? `${num(data.attendance.rate)}%` : "—"}</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("pp.present")}</span><span className="tabular-nums">{num(data.attendance.summary.PRESENT ?? 0)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("pp.late")}</span><span className="tabular-nums">{num(data.attendance.summary.LATE ?? 0)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("pp.absent")}</span><span className="tabular-nums">{num(data.attendance.summary.ABSENT ?? 0)}</span></div>
                </div>
              </CardContent>
            </Card>

            {/* GPA / latest results */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><GraduationCap className="h-4 w-4 text-primary" /> {t("pp.results")}</CardTitle></CardHeader>
              <CardContent>
                {gpaLine ? (
                  <div className="mb-3"><div className="text-3xl font-bold tabular-nums">{gpaLine.gpa}</div>
                    <div className="text-xs text-muted-foreground">{gpaLine.exam} · {gpaLine.grade}</div></div>
                ) : <p className="py-6 text-center text-sm text-muted-foreground">{t("pp.noResults")}</p>}
              </CardContent>
            </Card>

            {/* Fees */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Wallet className="h-4 w-4 text-primary" /> {t("pp.fees")}</CardTitle></CardHeader>
              <CardContent>
                <div className="mb-1 text-xs text-muted-foreground">{t("pp.outstanding")}</div>
                <div className={`text-3xl font-bold tabular-nums ${data.outstanding > 0 ? "text-destructive" : "text-success"}`}>{money(data.outstanding)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Results table */}
          {data.results.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">{t("pp.results")}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2">{t("pp.subject")}</th><th className="px-4 py-2">{t("pp.exam")}</th>
                      <th className="px-4 py-2">{t("pp.marks")}</th><th className="px-4 py-2">{t("pp.grade")}</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border">
                      {data.results.slice(0, 12).map((r) => (
                        <tr key={r.id}>
                          <td className="px-4 py-2">{r.subject?.name ?? "—"}</td>
                          <td className="px-4 py-2 text-muted-foreground">{r.exam?.name ?? "—"}</td>
                          <td className="px-4 py-2 tabular-nums">{num(r.marks)}/{num(r.totalMarks)}</td>
                          <td className="px-4 py-2">{r.grade ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoices + services */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">{t("pp.fees")}</CardTitle></CardHeader>
              <CardContent className="p-0">
                {data.invoices.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{t("pp.noInvoices")}</p> :
                  <div className="divide-y divide-border">
                    {data.invoices.slice(0, 6).map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <div><div className="font-medium tabular-nums">{inv.invoiceNo}</div>
                          <div className="text-xs text-muted-foreground">{t("pp.paid")}: {money(inv.paidTotal)} / {money(inv.total)}</div></div>
                        <Badge variant={invStatusVariant(inv.status)} dot>{inv.status}</Badge>
                      </div>
                    ))}
                  </div>}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Bus className="h-4 w-4 text-primary" /> {t("pp.transport")}</CardTitle></CardHeader>
                <CardContent className="text-sm">
                  {data.transport.length === 0 ? <p className="text-muted-foreground">{t("pp.noTransport")}</p> :
                    data.transport.map((tr) => <div key={tr.id}>{t("pp.route")}: {tr.route?.name ?? "—"}{tr.stop ? ` · ${t("pp.stop")}: ${tr.stop.name}` : ""}</div>)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><BedDouble className="h-4 w-4 text-primary" /> {t("pp.hostel")}</CardTitle></CardHeader>
                <CardContent className="text-sm">
                  {data.hostel.length === 0 ? <p className="text-muted-foreground">{t("pp.noHostel")}</p> :
                    data.hostel.map((h) => <div key={h.id}>{t("pp.building")}: {h.room?.building?.name ?? "—"} · {t("pp.room")}: {h.room?.roomNo ?? "—"}</div>)}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Notices */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Bell className="h-4 w-4 text-primary" /> {t("pp.notices")}</CardTitle></CardHeader>
            <CardContent className="p-0">
              {data.notices.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{t("pp.noNotices")}</p> :
                <div className="divide-y divide-border">
                  {data.notices.map((n) => (
                    <div key={n.id} className="px-4 py-3">
                      <div className="flex items-center gap-2"><span className="font-medium">{n.title}</span>{n.pinned && <Badge variant="warning">★</Badge>}</div>
                      <div className="text-xs text-muted-foreground">{date(n.createdAt)}</div>
                    </div>
                  ))}
                </div>}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">{t("common.tryAgain")}</CardContent></Card>
      )}
    </div>
  );
}
