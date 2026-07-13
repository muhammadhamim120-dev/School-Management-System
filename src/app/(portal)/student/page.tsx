"use client";
import * as React from "react";
import Link from "next/link";
import { CalendarCheck, Award, Wallet, NotebookPen, BookMarked, Bell, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { request } from "@/services/api-client";
import { formatDate } from "@/lib/utils";

type StudentDashboardData = {
  name: string;
  studentId: string;
  className: string | null;
  section: string | null;
  attendanceRate: number | null;
  attendanceSummary: Record<string, number>;
  gpa: { exam: string; gpa: number; grade: string } | null;
  outstandingFees: number;
  homeworkCount: number;
  todaySchedule: { subject: string; startTime: string; endTime: string; room: string | null }[];
  recentNotices: { id: string; title: string; pinned: boolean; createdAt: string }[];
  libraryLoans: number;
};

export default function StudentDashboardPage() {
  const [data, setData] = React.useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    request<StudentDashboardData>("/api/portal/student/homework")
      .then((d) => {
        // Build dashboard from available student data
        return request<StudentDashboardData>("/api/portal/overview");
      })
      .catch(() => null)
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title={data ? `Welcome, ${data.name}` : "Student Dashboard"}
        description={data ? `${data.className ?? ""}${data.section ? ` - ${data.section}` : ""} · ${data.studentId}` : ""}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-xl" />)
        ) : (
          <>
            <Link href="/portal/student/timetable">
              <Card className="transition-all hover:shadow-md hover:border-primary/30">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarClock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Timetable</div>
                    <div className="text-sm font-semibold">{data?.todaySchedule.length ?? 0} classes today</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/portal/student/homework">
              <Card className="transition-all hover:shadow-md hover:border-primary/30">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <NotebookPen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Homework</div>
                    <div className="text-sm font-semibold">{data?.homeworkCount ?? 0} pending</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/portal/student/results">
              <Card className="transition-all hover:shadow-md hover:border-primary/30">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Results</div>
                    <div className="text-sm font-semibold tabular-nums">
                      {data?.gpa ? `GPA ${data.gpa.gpa.toFixed(2)}` : "—"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/portal/student/library">
              <Card className="transition-all hover:shadow-md hover:border-primary/30">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <BookMarked className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Library</div>
                    <div className="text-sm font-semibold">{data?.libraryLoans ?? 0} active loans</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </>
        )}
      </div>

      {/* Attendance */}
      {!loading && data && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold tabular-nums">
                {data.attendanceRate !== null ? `${data.attendanceRate}%` : "—"}
              </div>
              <div className="flex gap-3 text-xs">
                {Object.entries(data.attendanceSummary).map(([status, count]) => (
                  <Badge key={status} variant="secondary">{status}: {count}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's schedule */}
      {!loading && data && data.todaySchedule.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Today&apos;s Schedule</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {data.todaySchedule.map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-24 shrink-0 text-xs text-muted-foreground tabular-nums">{s.startTime}–{s.endTime}</span>
                  <span className="flex-1 text-sm font-medium">{s.subject}</span>
                  <span className="text-xs text-muted-foreground">{s.room ?? ""}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notices */}
      {!loading && data && data.recentNotices.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Notices</CardTitle>
            <Link href="/portal/student/notices" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {data.recentNotices.slice(0, 4).map((n) => (
                <div key={n.id} className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {n.pinned && <Badge variant="secondary" className="text-[10px]">PINNED</Badge>}
                    <span className="text-sm font-medium">{n.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
