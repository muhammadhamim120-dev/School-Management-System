"use client";
import * as React from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { request } from "@/services/api-client";
import { formatDate } from "@/lib/utils";

type Message = {
  id: string;
  sender: string;
  body: string;
  createdAt: string;
  studentName: string;
  teacherName: string | null;
  readAt: string | null;
};

export default function ParentMessagesPage() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    request<{ messages: Message[] }>("/api/portal/parent/messages")
      .then((d) => setMessages(d?.messages ?? []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Messages" description="Messages from teachers about your children" />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[80px] rounded-xl" />)}
        </div>
      ) : messages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No messages yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Card key={m.id} className={!m.readAt ? "border-primary/30" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{m.teacherName ?? m.sender}</span>
                      <span className="text-xs text-muted-foreground">about {m.studentName}</span>
                      {!m.readAt && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{m.body}</p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                    {formatDate(m.createdAt)}
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
