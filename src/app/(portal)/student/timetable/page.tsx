"use client";
import * as React from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { request } from "@/services/api-client";

type TimetableSlot = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string | null;
  teacher: string | null;
  room: string | null;
};

type TimetableData = {
  className: string | null;
  section: string | null;
  slots: TimetableSlot[];
};

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export default function StudentTimetablePage() {
  const [data, setData] = React.useState<TimetableData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    request<TimetableData>("/api/portal/student/timetable")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const byDay = React.useMemo(() => {
    if (!data) return [];
    return DAYS.map((d) => ({
      day: d,
      slots: data.slots
        .filter((s) => s.day === d)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    })).filter((x) => x.slots.length);
  }, [data]);

  return (
    <div>
      <PageHeader
        title="Timetable"
        description={data ? `${data.className ?? ""}${data.section ? ` - ${data.section}` : ""}` : ""}
      />

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
        </div>
      ) : byDay.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No timetable published yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {byDay.map((d) => (
            <Card key={d.day}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm capitalize">{d.day.toLowerCase()}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {d.slots.map((s) => (
                    <div key={s.id} className="flex items-center gap-4 px-4 py-3">
                      <span className="w-28 shrink-0 text-xs text-muted-foreground tabular-nums">
                        {s.startTime}–{s.endTime}
                      </span>
                      <div className="flex-1">
                        <span className="text-sm font-medium">{s.subject ?? "—"}</span>
                        {s.teacher && (
                          <span className="ml-2 text-xs text-muted-foreground">{s.teacher}</span>
                        )}
                      </div>
                      {s.room && (
                        <span className="text-xs text-muted-foreground">{s.room}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
