"use client";
import * as React from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { request } from "@/services/api-client";

type ResultItem = {
  id: string;
  subject: string;
  marks: number;
  totalMarks: number;
  grade: string | null;
  exam: string | null;
};

type ResultsData = {
  gpa: { exam: string; gpa: number; grade: string } | null;
  results: ResultItem[];
};

export default function StudentResultsPage() {
  const [data, setData] = React.useState<ResultsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    request<ResultsData>("/api/portal/student/results")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Results" description="View your exam results and GPA" />

      {loading ? (
        <Skeleton className="h-[200px] rounded-xl" />
      ) : !data ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Failed to load results.</CardContent></Card>
      ) : (
        <>
          {data.gpa && (
            <Card className="mb-6">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm text-muted-foreground">{data.gpa.exam}</div>
                  <div className="text-2xl font-bold tabular-nums">GPA {data.gpa.gpa.toFixed(2)}</div>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">{data.gpa.grade}</Badge>
              </CardContent>
            </Card>
          )}

          {data.results.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No results recorded yet.</CardContent></Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">All Results</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {data.results.map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-4 py-3">
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
        </>
      )}
    </div>
  );
}
