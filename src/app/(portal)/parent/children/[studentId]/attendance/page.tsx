"use client";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { request } from "@/services/api-client";

type AttendanceRecord = {
  id: string;
  date: string;
  status: string;
  remark: string | null;
};

type AttendanceData = {
  studentName: string;
  summary: Record<string, number>;
  totalDays: number;
  rate: number | null;
  records: AttendanceRecord[];
};

const statusColor: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700",
  ABSENT: "bg-red-100 text-red-700",
  LATE: "bg-amber-100 text-amber-700",
  EXCUSED: "bg-blue-100 text-blue-700",
};

export default function ChildAttendancePage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const [data, setData] = React.useState<AttendanceData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    request<AttendanceData>(`/api/portal/parent/children/${studentId}/attendance`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [studentId]);

  return (
    <div>
      <Link href={`/portal/parent/children/${studentId}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-4">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>
      <PageHeader title="Attendance" description={data ? `${data.studentName} — ${data.rate !== null ? `${data.rate}% attendance rate` : ""}` : ""} />

      {loading ? (
        <Skeleton className="h-[200px] rounded-xl" />
      ) : !data ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Failed to load attendance.</CardContent></Card>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-3">
            {Object.entries(data.summary).map(([status, count]) => (
              <Badge key={status} variant="secondary" className={statusColor[status] ?? ""}>
                {status}: {count}
              </Badge>
            ))}
            <Badge variant="outline">Total: {data.totalDays}</Badge>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {data.records.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No attendance records.</p>
                ) : (
                  data.records.map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm tabular-nums">
                        {new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <div className="flex items-center gap-2">
                        {r.remark && <span className="text-xs text-muted-foreground">{r.remark}</span>}
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[r.status] ?? "bg-muted"}`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
