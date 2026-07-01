import { PageHero } from "@/components/public/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

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
      <PageHero title="School Events" subtitle="Discover what's happening at Greenwood throughout the year." />
      <section className="container py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {events.map((e) => (
            <Card key={e.id} className="transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold">{e.title}</h3>
                  <Badge variant={statusVariant(e.status)}>{e.status}</Badge>
                </div>
                {e.description && <p className="mb-4 text-sm text-muted-foreground">{e.description}</p>}
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> {formatDate(e.startDate)} – {formatDate(e.endDate)}
                  </div>
                  {e.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> {e.location}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
