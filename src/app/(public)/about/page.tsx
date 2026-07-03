"use client";
import { PageHero } from "@/components/public/page-hero";
import { useI18n } from "@/components/i18n-provider";
import { Target, Eye, Heart, Users } from "lucide-react";
import { Reveal, RevealGroup, RevealItem, SectionHeading } from "@/components/public/section";
import { Parallax } from "@/components/public/cinematic";

const values = [
  { icon: Target, title: "Excellence", desc: "We pursue the highest standards in everything we do." },
  { icon: Heart, title: "Compassion", desc: "We lead with empathy, kindness, and respect for all." },
  { icon: Users, title: "Community", desc: "We grow together through collaboration and inclusion." },
  { icon: Eye, title: "Vision", desc: "We prepare students to thrive in a changing world." },
];

export default function AboutPage() {
  const { t } = useI18n();
  return (
    <>
      <PageHero eyebrow={t("footer.aboutUs")} title={t("about.title")} subtitle={t("about.subtitle")} />
      <section className="container grid items-center gap-8 py-12 sm:gap-10 sm:py-16 lg:grid-cols-2">
        <Reveal>
          <Parallax speed={0.12}>
            <div className="relative">
              <div className="pointer-events-none absolute -inset-4 rounded-[32px] bg-primary/10 blur-2xl" />
              {/* eslint-disable-next-line @next/next/no-img-element -- static marketing image, remote host */}
              <img
                src="https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80"
                alt="School building"
                className="relative h-auto w-full rounded-3xl border border-border/60 shadow-float"
              />
            </div>
          </Parallax>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("about.story")}</h2>
            <p className="text-muted-foreground">
              Founded in 1998, Greenwood International School began with a simple but powerful idea:
              that every child deserves an education that nurtures both mind and character. What started
              as a small campus with 120 students has grown into a thriving institution serving over
              2,400 students from diverse backgrounds.
            </p>
            <p className="text-muted-foreground">
              Today, we remain committed to our founding mission — cultivating curious, confident, and
              compassionate individuals prepared to make a meaningful difference in the world.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="border-y border-border/50 bg-muted/30 py-12 sm:py-16">
        <div className="container grid gap-8 md:grid-cols-2">
          <Reveal>
            <div className="glow lift h-full rounded-2xl border border-border/60 bg-card/70 p-8 shadow-soft backdrop-blur">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">{t("about.mission")}</h3>
              <p className="mt-2 text-muted-foreground">
                To provide a nurturing, challenging, and inclusive learning environment that empowers
                every student to achieve academic excellence and become a responsible global citizen.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="glow lift h-full rounded-2xl border border-border/60 bg-card/70 p-8 shadow-soft backdrop-blur">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Eye className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">{t("about.vision")}</h3>
              <p className="mt-2 text-muted-foreground">
                To be a leading educational institution recognized for innovation, integrity, and the
                holistic development of future-ready leaders.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container py-16 sm:py-24">
        <SectionHeading eyebrow={t("about.values")} title={t("about.values")} description="The principles that guide everything we do." />
        <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <RevealItem key={v.title}>
                <div className="glow lift group h-full rounded-2xl border border-border/60 bg-card/70 p-6 text-center shadow-soft backdrop-blur">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-transform group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-semibold">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </section>
    </>
  );
}
