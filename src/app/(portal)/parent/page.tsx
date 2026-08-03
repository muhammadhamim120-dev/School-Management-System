"use client";
import * as React from "react";
import Link from "next/link";
import { Users, CalendarCheck, Award, Wallet, MessageCircle, CalendarDays, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { request } from "@/services/api-client";

type ChildOverview = {
  id: string;
  name: string;
  studentId: string;
  className: string | null;
  section: string | null;
  attendanceRate: number | null;
  latestGpa: number | null;
  outstandingFees: number;
};

type ParentDashboardData = {
  children: ChildOverview[];
  totalMessages: number;
  pendingLeaves: number;
};

export default function ParentDashboardPage() {
  const [data, setData] = React.useState<ParentDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    request<ParentDashboardData>("/api/portal/parent/children")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Parent Dashboard" description="Overview of your children's progress" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[116px] rounded-xl" />)
        ) : (
          <>
            <StatCard label="Children" count={data?.children.length ?? 0} icon={Users} />
            <StatCard label="Avg Attendance" count={data?.children.length ? Math.round(data.children.reduce((s, c) => s + (c.attendanceRate ?? 0), 0) / data.children.length) : 0} format={(n) => `${n}%`} icon={CalendarCheck} />
            <StatCard label="Messages" count={data?.totalMessages ?? 0} icon={MessageCircle} />
            <StatCard label="Pending Leaves" count={data?.pendingLeaves ?? 0} icon={CalendarDays} />
          </>
        )}
      </div>

      <h2 className="text-lg font-semibold mb-3">My Children</h2>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[180px] rounded-xl" />)}
        </div>
      ) : data?.children.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.children.map((child) => (
            <Link key={child.id} href={`/parent/children/${child.id}`}>
              <Card className="transition-all hover:shadow-md hover:border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{child.name}</CardTitle>
                  <CardDescription>{child.className}{child.section ? ` - ${child.section}` : ""} &middot; {child.studentId}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <div className="font-semibold tabular-nums">{child.attendanceRate !== null ? `${child.attendanceRate}%` : "—"}</div>
                      <div className="text-xs text-muted-foreground">Attendance</div>
                    </div>
                    <div>
                      <div className="font-semibold tabular-nums">{child.latestGpa !== null ? child.latestGpa.toFixed(2) : "—"}</div>
                      <div className="text-xs text-muted-foreground">GPA</div>
                    </div>
                    <div>
                      <div className={`font-semibold tabular-nums ${child.outstandingFees > 0 ? "text-destructive" : ""}`}>
                        {child.outstandingFees > 0 ? `৳${child.outstandingFees.toLocaleString()}` : "Clear"}
                      </div>
                      <div className="text-xs text-muted-foreground">Fees</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-primary">
                    View details <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="mx-auto mb-2 h-8 w-8 opacity-40" />
            <p>No children linked to your account yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
