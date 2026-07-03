"use client";
import Link from "next/link";
import { BookOpen, Users, Award, Microscope, Palette, Trophy, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { SmartImage } from "@/components/public/smart-image";
import { useI18n } from "@/components/i18n-provider";
import { AnimatedStat } from "@/components/public/animated-stat";
import { Reveal, RevealGroup, RevealItem, SectionHeading, FloatingCTA } from "@/components/public/section";
import { BlurText, Parallax, ScrollReveal } from "@/components/public/cinematic";

const features = [
  { icon: BookOpen, tKey: "home.feat.academic.t", dKey: "home.feat.academic.d" },
  { icon: Microscope, tKey: "home.feat.labs.t", dKey: "home.feat.labs.d" },
  { icon: Palette, tKey: "home.feat.arts.t", dKey: "home.feat.arts.d" },
  { icon: Trophy, tKey: "home.feat.sports.t", dKey: "home.feat.sports.d" },
  { icon: Users, tKey: "home.feat.faculty.t", dKey: "home.feat.faculty.d" },
  { icon: Award, tKey: "home.feat.results.t", dKey: "home.feat.results.d" },
] as const;

const stats = [
  { value: "2,400+", labelKey: "home.stat.students" },
  { value: "150+", labelKey: "home.stat.faculty" },
  { value: "98%", labelKey: "home.stat.graduation" },
  { value: "25+", labelKey: "home.stat.years" },
] as const;

const communityKeys = ["home.comm.1", "home.comm.2", "home.comm.3", "home.comm.4"] as const;

const ease = [0.22, 1, 0.36, 1] as const;

export default function HomePage() {
  const { t } = useI18n();
  return (
    <>
      {/* ---------------- Cinematic hero ---------------- */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-28">
        <div className="container grid items-center gap-8 sm:gap-10 lg:grid-cols-2">
          <div className="space-y-5 sm:space-y-6">
            <motion.span
              initial={{ opacity: 0, y: 12, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.6, ease }}
              className="inline-flex items-center rounded-full border border-border/60 glass px-3 py-1 text-xs font-medium text-primary sm:px-4 sm:py-1.5 sm:text-sm"
            >
              {t("home.badge")}
            </motion.span>
            <BlurText
              as="h1"
              text={`${t("home.headline1")} ${t("home.headline2")}`}
              highlight={t("home.headline2")}
              once={false}
              className="text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
            />
            <motion.p
              initial={{ opacity: 0, y: 18, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.7, delay: 0.5, ease }}
              className="max-w-lg text-base text-muted-foreground sm:text-lg"
            >
              {t("home.subhead")}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.65, ease }}
              className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"
            >
              <Link href="/admissions" className="press glow inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-elevated transition-transform hover:scale-[1.02]">
                {t("home.apply")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/about" className="press inline-flex items-center justify-center rounded-xl border border-border bg-card/60 px-6 py-3 text-sm font-medium transition-colors hover:bg-accent">
                {t("home.learnMore")}
              </Link>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ duration: 0.9, delay: 0.2, ease }}
            className="relative"
          >
            <Parallax speed={0.18}>
              <div className="pointer-events-none absolute -inset-4 rounded-[32px] bg-gradient-to-tr from-primary/20 to-chart-3/20 blur-2xl" style={{ background: "linear-gradient(to top right, hsl(var(--primary) / 0.2), hsl(var(--chart-3) / 0.18))" }} />
              <SmartImage
                src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80"
                fallbackSrc="/images/campus.svg"
                alt="Greenwood International School campus"
                width={1200}
                height={800}
                className="relative h-auto w-full rounded-3xl border border-border/60 shadow-float"
              />
            </Parallax>
          </motion.div>
        </div>
      </section>

      {/* ---------------- Animated stats ---------------- */}
      <section className="container">
        <div className="rounded-3xl border border-border/60 glass px-4 py-8 shadow-soft sm:px-6 sm:py-12">
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
            {stats.map((s) => (
              <AnimatedStat key={s.labelKey} value={s.value} label={t(s.labelKey)} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section className="container py-16 sm:py-24 lg:py-28">
        <SectionHeading eyebrow={t("public.home")} title={t("home.whyTitle")} description={t("home.whyDesc")} />
        <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <RevealItem key={f.tKey}>
                <div className="glow lift group h-full rounded-2xl border border-border/60 bg-card/70 p-6 shadow-soft backdrop-blur">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-transform group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{t(f.tKey)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t(f.dKey)}</p>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </section>

      {/* ---------------- Community ---------------- */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="container grid items-center gap-8 py-16 sm:gap-12 sm:py-20 lg:grid-cols-2">
          <Reveal>
            <Parallax speed={0.14}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-4 rounded-[32px] bg-primary/10 blur-2xl" />
                <SmartImage
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80"
                  fallbackSrc="/images/campus.svg"
                  alt="Students learning"
                  width={1200}
                  height={800}
                  className="relative h-auto w-full rounded-3xl border border-border/60 shadow-float"
                />
              </div>
            </Parallax>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="space-y-5">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("home.communityTitle")}</h2>
              <p className="text-muted-foreground">{t("home.communityDesc")}</p>
              <ul className="space-y-3">
                {communityKeys.map((k) => (
                  <li key={k} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">{t(k)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Floating CTA ---------------- */}
      <FloatingCTA
        title={t("home.ctaTitle")}
        description={t("home.ctaDesc")}
        primaryHref="/admissions"
        primaryLabel={t("home.ctaButton")}
        secondaryHref="/contact"
        secondaryLabel={t("public.contact")}
      />
    </>
  );
}
