"use client";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { request } from "@/services/api-client";
import { formatDate } from "@/lib/utils";

type FeeRecord = {
  id: string;
  title: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: string;
};

type FeesData = {
  studentName: string;
  outstanding: number;
  fees: FeeRecord[];
};

const statusColor: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700",
  UNPAID: "bg-red-100 text-red-700",
  PARTIAL: "bg-amber-100 text-amber-700",
  OVERDUE: "bg-red-100 text-red-700",
};

export default function ChildFeesPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const [data, setData] = React.useState<FeesData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    request<FeesData>(`/api/portal/parent/children/${studentId}/fees`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [studentId]);

  return (
    <div>
      <Link href={`/parent/children/${studentId}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-4">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>
      <PageHeader title="Fees" description={data?.studentName ?? ""} />

      {loading ? (
        <Skeleton className="h-[200px] rounded-xl" />
      ) : !data ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Failed to load fees.</CardContent></Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Outstanding</div>
              <div className={`text-2xl font-bold tabular-nums ${data.outstanding > 0 ? "text-destructive" : "text-emerald-600"}`}>
                ৳{data.outstanding.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          {data.fees.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No fee records.</CardContent></Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Fee History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {data.fees.map((f) => (
                    <div key={f.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <div className="text-sm font-medium">{f.title}</div>
                        <div className="text-xs text-muted-foreground">Due: {formatDate(f.dueDate)}</div>
                      </div>
                      <div className="text-right">
                        <div className="tabular-nums text-sm">৳{f.amount.toLocaleString()}</div>
                        <Badge variant="secondary" className={`text-xs ${statusColor[f.status] ?? ""}`}>{f.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
