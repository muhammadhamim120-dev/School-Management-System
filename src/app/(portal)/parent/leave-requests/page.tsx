"use client";
import * as React from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { request } from "@/services/api-client";
import { formatDate } from "@/lib/utils";

type LeaveRequest = {
  id: string;
  studentName: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  reviewNote: string | null;
};

const statusColor: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function ParentLeaveRequestsPage() {
  const [leaves, setLeaves] = React.useState<LeaveRequest[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Fetch from overview which contains leave data
    request<{ leaves: LeaveRequest[] }>("/api/portal/overview")
      .then((d) => setLeaves(d.leaves ?? []))
      .catch(() => setLeaves([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Leave Requests" description="View and track your children's leave requests" />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-xl" />)}
        </div>
      ) : leaves.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No leave requests yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {leaves.map((l) => (
            <Card key={l.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{l.studentName}</span>
                      <Badge variant="secondary" className={`text-xs ${statusColor[l.status] ?? ""}`}>
                        {l.status}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatDate(l.fromDate)} — {formatDate(l.toDate)}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{l.reason}</p>
                    {l.reviewNote && (
                      <p className="mt-1 text-xs text-muted-foreground italic">Admin: {l.reviewNote}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
