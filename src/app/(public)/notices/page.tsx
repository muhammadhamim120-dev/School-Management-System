import { PageHero } from "@/components/public/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pin, Bell } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type NoticeItem = { id: string; title: string; content: string; audience: string; pinned: boolean; createdAt: Date | string };

const sampleNotices: NoticeItem[] = [
  { id: "1", title: "Annual Sports Day 2025", content: "Our annual sports day will be held on March 15th. All students are encouraged to participate. Parents are warmly invited to attend.", audience: "ALL", pinned: true, createdAt: new Date() },
  { id: "2", title: "Parent-Teacher Conference", content: "The term parent-teacher conference is scheduled for February 28th. Please book your slots through the parent portal.", audience: "PARENTS", pinned: true, createdAt: new Date() },
  { id: "3", title: "Mid-Term Examination Schedule", content: "Mid-term examinations begin on February 10th. The detailed timetable has been shared with all students.", audience: "STUDENTS", pinned: false, createdAt: new Date() },
  { id: "4", title: "Library Week Celebration", content: "Join us for a week of reading challenges, author visits, and book fairs from January 20th to 24th.", audience: "ALL", pinned: false, createdAt: new Date() },
];

async function getNotices(): Promise<NoticeItem[]> {
  try {
    const notices = await prisma.notice.findMany({
      take: 20,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });
    return notices.length ? notices : sampleNotices;
  } catch {
    return sampleNotices;
  }
}

export default async function NoticesPage() {
  const notices = await getNotices();
  return (
    <>
      <PageHero title="Notice Board" subtitle="Stay updated with the latest announcements and information." />
      <section className="container max-w-3xl py-16">
        <div className="space-y-4">
          {notices.map((n) => (
            <Card key={n.id} className={n.pinned ? "border-primary/40" : ""}>
              <CardContent className="p-6">
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {n.pinned ? <Pin className="h-4 w-4 text-primary" /> : <Bell className="h-4 w-4 text-muted-foreground" />}
                    <h3 className="text-lg font-semibold">{n.title}</h3>
                  </div>
                  <Badge variant="secondary">{n.audience}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{n.content}</p>
                <p className="mt-3 text-xs text-muted-foreground">{formatDate(n.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
