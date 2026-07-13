"use client";
import * as React from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { request } from "@/services/api-client";
import { formatDate } from "@/lib/utils";

type LibraryLoan = {
  id: string;
  bookTitle: string;
  copyCode: string;
  issuedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: string;
  fineAmount: number;
};

type LibraryData = {
  activeLoans: LibraryLoan[];
  history: LibraryLoan[];
};

const statusColor: Record<string, string> = {
  ISSUED: "bg-blue-100 text-blue-700",
  RETURNED: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
  LOST: "bg-red-100 text-red-700",
  DAMAGED: "bg-amber-100 text-amber-700",
};

export default function StudentLibraryPage() {
  const [data, setData] = React.useState<LibraryData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    request<LibraryData>("/api/portal/student/library")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Library" description="Your book loans and history" />

      {loading ? (
        <Skeleton className="h-[200px] rounded-xl" />
      ) : !data ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Failed to load library data.</CardContent></Card>
      ) : (
        <>
          <h2 className="text-lg font-semibold mb-3">Active Loans</h2>
          {data.activeLoans.length === 0 ? (
            <Card className="mb-6">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No active book loans.
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {data.activeLoans.map((l) => (
                    <div key={l.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <div className="text-sm font-medium">{l.bookTitle}</div>
                        <div className="text-xs text-muted-foreground">
                          Copy: {l.copyCode} · Issued: {formatDate(l.issuedAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className={`text-xs ${statusColor[l.status] ?? ""}`}>
                          {l.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1 tabular-nums">
                          Due: {formatDate(l.dueDate)}
                        </div>
                        {l.fineAmount > 0 && (
                          <div className="text-xs text-destructive mt-0.5">Fine: ৳{l.fineAmount}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <h2 className="text-lg font-semibold mb-3">Loan History</h2>
          {data.history.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No loan history.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {data.history.map((l) => (
                    <div key={l.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <div className="text-sm font-medium">{l.bookTitle}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(l.issuedAt)} — {l.returnedAt ? formatDate(l.returnedAt) : "Not returned"}
                        </div>
                      </div>
                      <Badge variant="secondary" className={`text-xs ${statusColor[l.status] ?? ""}`}>
                        {l.status}
                      </Badge>
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
