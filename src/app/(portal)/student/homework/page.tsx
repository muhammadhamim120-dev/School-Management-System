"use client";
import * as React from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { request } from "@/services/api-client";
import { formatDate } from "@/lib/utils";

type HomeworkItem = {
  id: string;
  title: string;
  details: string;
  subject: string | null;
  teacher: string | null;
  assignedOn: string;
  dueDate: string;
  submissionStatus: string | null;
  marks: number | null;
  totalMarks: number;
  feedback: string | null;
};

export default function StudentHomeworkPage() {
  const [homework, setHomework] = React.useState<HomeworkItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    request<{ homework: HomeworkItem[] }>("/api/portal/student/homework")
      .then((d) => setHomework(d.homework))
      .catch(() => setHomework([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Homework" description="View and submit your assignments" />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
        </div>
      ) : homework.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No homework assigned.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {homework.map((h) => (
            <Card key={h.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{h.title}</span>
                      {h.submissionStatus && (
                        <Badge variant={h.submissionStatus === "GRADED" ? "default" : "secondary"} className="text-xs">
                          {h.submissionStatus}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {h.subject ?? ""}{h.teacher ? ` · ${h.teacher}` : ""}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{h.details}</p>
                    {h.feedback && (
                      <p className="mt-1 text-xs text-muted-foreground italic">Feedback: {h.feedback}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground tabular-nums">Due {formatDate(h.dueDate)}</div>
                    {h.marks !== null && (
                      <div className="text-sm font-semibold tabular-nums mt-1">
                        {h.marks}/{h.totalMarks}
                      </div>
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
