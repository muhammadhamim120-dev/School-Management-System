"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Award, Wallet } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
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

export default function ParentChildrenPage() {
  const [children, setChildren] = React.useState<ChildOverview[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    request<{ children: ChildOverview[] }>("/api/portal/parent/children")
      .then((d) => setChildren(d.children))
      .catch(() => setChildren([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="My Children" description="View and manage your children's academic progress" />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[200px] rounded-xl" />)}
        </div>
      ) : children.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <Link key={child.id} href={`/portal/parent/children/${child.id}`}>
              <Card className="transition-all hover:shadow-md hover:border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{child.name}</CardTitle>
                  <CardDescription>
                    {child.className}{child.section ? ` - ${child.section}` : ""} &middot; {child.studentId}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="space-y-1">
                      <CalendarCheck className="mx-auto h-4 w-4 text-muted-foreground" />
                      <div className="font-semibold tabular-nums">
                        {child.attendanceRate !== null ? `${child.attendanceRate}%` : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">Attendance</div>
                    </div>
                    <div className="space-y-1">
                      <Award className="mx-auto h-4 w-4 text-muted-foreground" />
                      <div className="font-semibold tabular-nums">
                        {child.latestGpa !== null ? child.latestGpa.toFixed(2) : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">GPA</div>
                    </div>
                    <div className="space-y-1">
                      <Wallet className="mx-auto h-4 w-4 text-muted-foreground" />
                      <div className={`font-semibold tabular-nums ${child.outstandingFees > 0 ? "text-destructive" : ""}`}>
                        {child.outstandingFees > 0 ? `৳${child.outstandingFees.toLocaleString()}` : "Clear"}
                      </div>
                      <div className="text-xs text-muted-foreground">Fees Due</div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-1 text-xs font-medium text-primary">
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
            <p>No children linked to your account.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
