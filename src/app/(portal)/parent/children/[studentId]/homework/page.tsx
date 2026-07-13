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
import { formatDate } from "@/lib/utils";

type HomeworkRecord = {
  id: string;
  title: string;
  details: string;
  subject: string | null;
  teacher: string | null;
  assignedOn: string;
  dueDate: string;
  submissionStatus: string | null;
};

type HomeworkData = {
  studentName: string;
  homework: HomeworkRecord[];
};

export default function ChildHomeworkPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const [data, setData] = React.useState<HomeworkData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    request<HomeworkData>(`/api/portal/parent/children/${studentId}/homework`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [studentId]);

  return (
    <div>
      <Link href={`/portal/parent/children/${studentId}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-4">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>
      <PageHeader title="Homework" description={data?.studentName ?? ""} />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-xl" />)}
        </div>
      ) : !data ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Failed to load homework.</CardContent></Card>
      ) : data.homework.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No homework assigned.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {data.homework.map((h) => (
            <Card key={h.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{h.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {h.subject ?? ""}{h.teacher ? ` · ${h.teacher}` : ""}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{h.details}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground tabular-nums">Due {formatDate(h.dueDate)}</div>
                    {h.submissionStatus && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {h.submissionStatus}
                      </Badge>
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
