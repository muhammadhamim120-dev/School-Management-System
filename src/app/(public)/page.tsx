"use client";
import Link from "next/link";
import { BookOpen, Users, Award, Microscope, Palette, Trophy, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SmartImage } from "@/components/public/smart-image";
import { useI18n } from "@/components/i18n-provider";

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

export default function HomePage() {
  const { t } = useI18n();
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container grid items-center gap-8 py-20 lg:grid-cols-2 lg:py-28">
          <div className="space-y-6 animate-fade-in">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {t("home.badge")}
            </span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t("home.headline1")} <span className="text-primary">{t("home.headline2")}</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("home.subhead")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/admissions">{t("home.apply")} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/about">{t("home.learnMore")}</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <SmartImage
              src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80"
              fallbackSrc="/images/campus.svg"
              alt="Greenwood International School campus"
              width={1200}
              height={800}
              className="w-full rounded-2xl border shadow-xl"
            />
          </div>
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="container grid grid-cols-2 gap-6 py-12 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.labelKey} className="text-center">
              <div className="text-3xl font-bold text-primary sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{t(s.labelKey)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">{t("home.whyTitle")}</h2>
          <p className="mt-3 text-muted-foreground">
            {t("home.whyDesc")}
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.tKey} className="transition-shadow hover:shadow-lg">
                <CardContent className="space-y-3 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{t(f.tKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(f.dKey)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="bg-muted/40">
        <div className="container grid items-center gap-10 py-20 lg:grid-cols-2">
          <SmartImage
            src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80"
            fallbackSrc="/images/campus.svg"
            alt="Students learning"
            width={1200}
            height={800}
            className="w-full rounded-2xl border shadow-lg"
          />
          <div className="space-y-5">
            <h2 className="text-3xl font-bold tracking-tight">{t("home.communityTitle")}</h2>
            <p className="text-muted-foreground">
              {t("home.communityDesc")}
            </p>
            <ul className="space-y-3">
              {communityKeys.map((k) => (
                <li key={k} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">{t(k)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <Card className="overflow-hidden bg-primary text-primary-foreground">
          <CardContent className="flex flex-col items-center gap-6 p-12 text-center">
            <h2 className="text-3xl font-bold">{t("home.ctaTitle")}</h2>
            <p className="max-w-xl opacity-90">
              {t("home.ctaDesc")}
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/admissions">{t("home.ctaButton")} <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
