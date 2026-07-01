import Link from "next/link";
import { PageHero } from "@/components/public/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ClipboardCheck, CalendarCheck, GraduationCap, CheckCircle2 } from "lucide-react";

const steps = [
  { icon: FileText, title: "Submit Application", desc: "Complete the online application form with required documents." },
  { icon: ClipboardCheck, title: "Assessment", desc: "Student sits for an age-appropriate entrance assessment." },
  { icon: CalendarCheck, title: "Interview", desc: "Family and student meet with our admissions team." },
  { icon: GraduationCap, title: "Enrollment", desc: "Receive your offer and complete enrollment formalities." },
];

const requirements = [
  "Completed application form",
  "Birth certificate copy",
  "Previous academic records / report cards",
  "Two passport-size photographs",
  "Transfer certificate (for grade 2 and above)",
  "Immunization records",
];

const tuition = [
  { level: "Kindergarten", fee: "$4,500 / year" },
  { level: "Primary (Grades 1–5)", fee: "$6,200 / year" },
  { level: "Middle (Grades 6–8)", fee: "$7,800 / year" },
  { level: "Secondary (Grades 9–12)", fee: "$9,500 / year" },
];

export default function AdmissionsPage() {
  return (
    <>
      <PageHero title="Admissions" subtitle="Join a community dedicated to nurturing excellence. Here's how to apply." />

      <section className="container py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-bold">Admission Process</h2>
          <p className="mt-3 text-muted-foreground">Four simple steps to becoming a Greenwood student.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="relative">
                <CardContent className="space-y-3 p-6">
                  <span className="absolute right-4 top-4 text-3xl font-bold text-muted/30">{i + 1}</span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <div className="container grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-3xl font-bold">Required Documents</h2>
            <ul className="space-y-3">
              {requirements.map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">{r}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-6 text-3xl font-bold">Tuition Fees</h2>
            <Card>
              <CardContent className="divide-y p-0">
                {tuition.map((t) => (
                  <div key={t.level} className="flex items-center justify-between p-4">
                    <span className="text-sm font-medium">{t.level}</span>
                    <span className="text-sm text-primary">{t.fee}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <p className="mt-3 text-xs text-muted-foreground">
              * Scholarships and financial aid available for qualifying families.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-16 text-center">
        <h2 className="text-3xl font-bold">Have Questions?</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Our admissions team is here to help you through every step of the process.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg"><Link href="/contact">Contact Admissions</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/about">Explore the School</Link></Button>
        </div>
      </section>
    </>
  );
}
