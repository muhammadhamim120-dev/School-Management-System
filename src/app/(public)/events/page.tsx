import { PageHero } from "@/components/public/page-hero";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Reveal } from "@/components/public/section";

export const dynamic = "force-dynamic";

type EventItem = { id: string; title: string; description?: string | null; location?: string | null; startDate: Date | string; endDate: Date | string; status: string };

const sampleEvents: EventItem[] = [
  { id: "1", title: "Science Fair 2025", description: "Students showcase innovative projects across physics, chemistry, and biology.", location: "Main Auditorium", startDate: new Date(Date.now() + 6e8), endDate: new Date(Date.now() + 7e8), status: "UPCOMING" },
  { id: "2", title: "Annual Cultural Festival", description: "A vibrant celebration of music, dance, and drama by our talented students.", location: "School Grounds", startDate: new Date(Date.now() + 12e8), endDate: new Date(Date.now() + 13e8), status: "UPCOMING" },
  { id: "3", title: "Inter-School Debate", description: "Greenwood hosts the regional debate championship.", location: "Conference Hall", startDate: new Date(Date.now() + 18e8), endDate: new Date(Date.now() + 19e8), status: "UPCOMING" },
  { id: "4", title: "Graduation Ceremony", description: "Celebrating the achievements of our graduating class of 2025.", location: "Main Auditorium", startDate: new Date(Date.now() + 24e8), endDate: new Date(Date.now() + 25e8), status: "UPCOMING" },
];

const statusVariant = (s: string) =>
  s === "UPCOMING" ? "default" : s === "ONGOING" ? "success" : s === "CANCELLED" ? "destructive" : "secondary";

async function getEvents(): Promise<EventItem[]> {
  try {
    const events = await prisma.event.findMany({ take: 20, orderBy: { startDate: "asc" } });
    return events.length ? events : sampleEvents;
  } catch {
    return sampleEvents;
  }
}

export default async function EventsPage() {
  const events = await getEvents();
  return (
    <>
      <PageHero eyebrow="What's on" title="School Events" subtitle="Discover what's happening at Greenwood throughout the year." />
      <section className="container py-14 sm:py-16">
        <div className="relative mx-auto max-w-3xl">
          {/* timeline spine */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-primary/60 via-border to-transparent sm:left-1/2" aria-hidden />
          <div className="space-y-6 sm:space-y-8">
            {events.map((e, i) => (
              <Reveal key={e.id} delay={i * 0.05}>
                <div className={`relative flex flex-col gap-4 sm:flex-row sm:items-center ${i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"}`}>
                  {/* node */}
                  <div className="absolute left-4 top-6 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-primary ring-4 ring-background sm:left-1/2" aria-hidden />
                  <div className="pl-10 sm:w-1/2 sm:pl-0 sm:px-8">
                    <div className="glow lift rounded-2xl border border-border/60 bg-card/70 p-5 shadow-soft backdrop-blur sm:p-6">
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <h3 className="text-lg font-semibold">{e.title}</h3>
                        <Badge variant={statusVariant(e.status)}>{e.status}</Badge>
                      </div>
                      {e.description && <p className="mb-4 text-sm text-muted-foreground">{e.description}</p>}
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {formatDate(e.startDate)} – {formatDate(e.endDate)}</div>
                        {e.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {e.location}</div>}
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:block sm:w-1/2" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
