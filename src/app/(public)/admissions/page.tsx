"use client";
import { useI18n } from "@/components/i18n-provider";
import { PageHero } from "@/components/public/page-hero";
import { FileText, ClipboardCheck, CalendarCheck, GraduationCap, CheckCircle2 } from "lucide-react";
import { Reveal, RevealGroup, RevealItem, SectionHeading, FloatingCTA } from "@/components/public/section";

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
  const { t } = useI18n();
  return (
    <>
      <PageHero eyebrow={t("public.admissions")} title={t("adm.title")} subtitle={t("adm.subtitle")} />

      <section className="container py-16 sm:py-24">
        <SectionHeading eyebrow={t("adm.process")} title={t("adm.process")} description="Four simple steps to becoming a Greenwood student." />
        <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <RevealItem key={s.title}>
                <div className="glow lift group relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-6 shadow-soft backdrop-blur">
                  <span className="absolute right-4 top-3 text-4xl font-bold text-primary/10">{i + 1}</span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-transform group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </section>

      <section className="border-y border-border/50 bg-muted/30 py-12 sm:py-16">
        <div className="container grid gap-10 lg:grid-cols-2">
          <Reveal>
            <div>
              <h2 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">{t("adm.documents")}</h2>
              <ul className="space-y-3">
                {requirements.map((r) => (
                  <li key={r} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <h2 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">{t("adm.fees")}</h2>
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-soft backdrop-blur">
                <div className="divide-y divide-border/60">
                  {tuition.map((tf) => (
                    <div key={tf.level} className="flex items-center justify-between p-4 transition-colors hover:bg-accent/40">
                      <span className="text-sm font-medium">{tf.level}</span>
                      <span className="text-sm font-semibold text-primary">{tf.fee}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                * Scholarships and financial aid available for qualifying families.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <FloatingCTA
        title={t("adm.questions")}
        description="Our admissions team is here to help you through every step of the process."
        primaryHref="/contact"
        primaryLabel="Contact Admissions"
        secondaryHref="/about"
        secondaryLabel="Explore the School"
      />
    </>
  );
}
