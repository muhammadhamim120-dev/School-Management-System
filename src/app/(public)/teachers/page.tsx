import { PageHero } from "@/components/public/page-hero";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { prisma } from "@/lib/prisma";
import { initials, avatarUrl } from "@/lib/utils";
import { Reveal } from "@/components/public/section";

export const dynamic = "force-dynamic";

type FacultyMember = { id: string; fullName: string; photo?: string | null; department?: string | null; subject?: string | null; qualification?: string | null };

const sampleFaculty: FacultyMember[] = [
  { id: "1", fullName: "Dr. Eleanor Vance", department: "Science", subject: "Physics", qualification: "Ph.D. Physics" },
  { id: "2", fullName: "Mr. James Okoro", department: "Mathematics", subject: "Calculus", qualification: "M.Sc. Mathematics" },
  { id: "3", fullName: "Ms. Priya Nair", department: "Languages", subject: "English Literature", qualification: "M.A. English" },
  { id: "4", fullName: "Mr. Daniel Cho", department: "Humanities", subject: "History", qualification: "M.A. History" },
  { id: "5", fullName: "Mrs. Sofia Rossi", department: "Arts", subject: "Visual Arts", qualification: "MFA" },
  { id: "6", fullName: "Mr. Ahmed Hassan", department: "Physical Education", subject: "Athletics", qualification: "B.Sc. Sports Science" },
];

async function getFaculty(): Promise<FacultyMember[]> {
  try {
    const teachers = await prisma.teacher.findMany({
      where: { status: "ACTIVE" },
      take: 12,
      orderBy: { createdAt: "desc" },
    });
    return teachers.length ? teachers : sampleFaculty;
  } catch {
    return sampleFaculty;
  }
}

export default async function TeachersPage() {
  const faculty = await getFaculty();
  return (
    <>
      <PageHero eyebrow="Our people" title="Our Faculty" subtitle="Meet the dedicated educators who make Greenwood exceptional." />
      <section className="container py-12 sm:py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {faculty.map((t, i) => (
            <Reveal key={t.id} delay={(i % 3) * 0.08}>
              <div className="glow lift group h-full rounded-2xl border border-border/60 bg-card/70 p-8 text-center shadow-soft backdrop-blur">
                <div className="relative mx-auto w-fit">
                  <div className="pointer-events-none absolute -inset-2 rounded-full bg-primary/15 opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
                  <Avatar className="relative h-24 w-24 ring-2 ring-border/60 transition-transform group-hover:scale-105">
                    <AvatarImage src={t.photo || avatarUrl(t.fullName)} alt={t.fullName} />
                    <AvatarFallback className="text-lg">{initials(t.fullName)}</AvatarFallback>
                  </Avatar>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{t.fullName}</h3>
                <p className="text-sm text-primary">{t.subject || t.department || "Faculty"}</p>
                {t.qualification && <p className="mt-1 text-xs text-muted-foreground">{t.qualification}</p>}
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
