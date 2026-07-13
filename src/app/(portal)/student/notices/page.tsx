"use client";
import * as React from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { request } from "@/services/api-client";
import { formatDate } from "@/lib/utils";

type Notice = {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
};

export default function StudentNoticesPage() {
  const [notices, setNotices] = React.useState<Notice[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    request<{ notices: Notice[] }>("/api/portal/student/notices")
      .then((d) => setNotices(d.notices))
      .catch(() => setNotices([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Notices" description="School announcements and updates" />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-xl" />)}
        </div>
      ) : notices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No notices published.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <Card key={n.id} className={n.pinned ? "border-primary/30" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {n.pinned && <Badge variant="secondary" className="text-[10px]">PINNED</Badge>}
                      <span className="text-sm font-medium">{n.title}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                    {formatDate(n.createdAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
