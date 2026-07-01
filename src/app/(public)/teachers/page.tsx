import { PageHero } from "@/components/public/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { prisma } from "@/lib/prisma";
import { initials, avatarUrl } from "@/lib/utils";

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
      <PageHero title="Our Faculty" subtitle="Meet the dedicated educators who make Greenwood exceptional." />
      <section className="container py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {faculty.map((t) => (
            <Card key={t.id} className="text-center transition-shadow hover:shadow-lg">
              <CardContent className="flex flex-col items-center gap-3 p-8">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={t.photo || avatarUrl(t.fullName)} alt={t.fullName} />
                  <AvatarFallback className="text-lg">{initials(t.fullName)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{t.fullName}</h3>
                  <p className="text-sm text-primary">{t.subject || t.department || "Faculty"}</p>
                  {t.qualification && <p className="mt-1 text-xs text-muted-foreground">{t.qualification}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
