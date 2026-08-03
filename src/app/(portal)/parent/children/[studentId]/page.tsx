"use client";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarCheck, Award, Wallet, NotebookPen, ArrowRight, ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { request } from "@/services/api-client";
import { formatDate } from "@/lib/utils";

type ChildDetail = {
  id: string;
  name: string;
  studentId: string;
  className: string | null;
  section: string | null;
  roll: string | null;
  photo: string | null;
  attendanceRate: number | null;
  attendanceSummary: Record<string, number>;
  latestGpa: { exam: string; gpa: number; grade: string } | null;
  recentResults: { id: string; subject: string; marks: number; totalMarks: number; grade: string | null; exam: string | null }[];
  outstandingFees: number;
  recentHomework: { id: string; title: string; subject: string; dueDate: string }[];
};

export default function ChildDetailPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const [data, setData] = React.useState<ChildDetail | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    request<ChildDetail>(`/api/portal/parent/children/${studentId}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div>
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-muted-foreground">
        Child not found or access denied.
      </div>
    );
  }

  const navItems = [
    { label: "Attendance", href: `/parent/children/${studentId}/attendance`, icon: CalendarCheck, stat: data.attendanceRate !== null ? `${data.attendanceRate}%` : "—" },
    { label: "Results", href: `/parent/children/${studentId}/results`, icon: Award, stat: data.latestGpa ? `GPA ${data.latestGpa.gpa.toFixed(2)}` : "—" },
    { label: "Fees", href: `/parent/children/${studentId}/fees`, icon: Wallet, stat: data.outstandingFees > 0 ? `৳${data.outstandingFees.toLocaleString()}` : "Clear" },
    { label: "Homework", href: `/parent/children/${studentId}/homework`, icon: NotebookPen, stat: `${data.recentHomework.length}` },
  ];

  return (
    <div>
      <Link href="/parent/children" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-4">
        <ChevronLeft className="h-4 w-4" /> Back to children
      </Link>
      <PageHeader title={data.name} description={`${data.className ?? ""}${data.section ? ` - ${data.section}` : ""} · ${data.studentId}${data.roll ? ` · Roll ${data.roll}` : ""}`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href}>
              <Card className="transition-all hover:shadow-md hover:border-primary/30">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                    <div className="text-lg font-semibold tabular-nums">{item.stat}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Attendance summary */}
      {Object.keys(data.attendanceSummary).length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(data.attendanceSummary).map(([status, count]) => (
                <Badge key={status} variant={status === "PRESENT" ? "default" : status === "ABSENT" ? "destructive" : "secondary"}>
                  {status}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent results */}
      {data.recentResults.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Recent Results</CardTitle>
            <Link href={`/parent/children/${studentId}/results`} className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {data.recentResults.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <div className="text-sm font-medium">{r.subject}</div>
                    <div className="text-xs text-muted-foreground">{r.exam ?? ""}</div>
                  </div>
                  <div className="text-right">
                    <span className="tabular-nums text-sm">{r.marks}/{r.totalMarks}</span>
                    {r.grade && <span className="ml-2 text-xs font-semibold text-primary">{r.grade}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent homework */}
      {data.recentHomework.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Recent Homework</CardTitle>
            <Link href={`/parent/children/${studentId}/homework`} className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {data.recentHomework.slice(0, 5).map((h) => (
                <div key={h.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <div className="text-sm font-medium">{h.title}</div>
                    <div className="text-xs text-muted-foreground">{h.subject}</div>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">Due {formatDate(h.dueDate)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
