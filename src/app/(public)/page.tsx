import Link from "next/link";
import { BookOpen, Users, Award, Microscope, Palette, Trophy, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SmartImage } from "@/components/public/smart-image";

const features = [
  { icon: BookOpen, title: "Academic Excellence", desc: "A rigorous, future-ready curriculum designed to inspire curiosity and critical thinking." },
  { icon: Microscope, title: "Modern Labs", desc: "State-of-the-art science and computer labs for hands-on, experiential learning." },
  { icon: Palette, title: "Arts & Culture", desc: "Vibrant programs in music, visual arts, and drama to nurture creative expression." },
  { icon: Trophy, title: "Sports & Athletics", desc: "Competitive teams and facilities that build teamwork, discipline, and resilience." },
  { icon: Users, title: "Expert Faculty", desc: "Passionate, qualified educators committed to every student's individual growth." },
  { icon: Award, title: "Proven Results", desc: "Consistently top-ranked outcomes and university placements year after year." },
];

const stats = [
  { value: "2,400+", label: "Students" },
  { value: "150+", label: "Faculty" },
  { value: "98%", label: "Graduation Rate" },
  { value: "25+", label: "Years of Excellence" },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container grid items-center gap-8 py-20 lg:grid-cols-2 lg:py-28">
          <div className="space-y-6 animate-fade-in">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Admissions open for 2025–2026
            </span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Where Learning Meets <span className="text-primary">Limitless Potential</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Greenwood International School empowers students to become confident, compassionate,
              and capable leaders ready to shape the world.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/admissions">Apply Now <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/about">Learn More</Link>
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
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-primary sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Why Choose Greenwood?</h2>
          <p className="mt-3 text-muted-foreground">
            A holistic education that balances academic rigor with character, creativity, and community.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="transition-shadow hover:shadow-lg">
                <CardContent className="space-y-3 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
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
            <h2 className="text-3xl font-bold tracking-tight">A Community That Cares</h2>
            <p className="text-muted-foreground">
              Our approach goes beyond textbooks. We foster a supportive environment where every
              student feels seen, valued, and inspired to reach their full potential.
            </p>
            <ul className="space-y-3">
              {[
                "Small class sizes for personalized attention",
                "Comprehensive counseling and student wellbeing programs",
                "Strong parent-teacher partnership",
                "Global exchange and enrichment opportunities",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <Card className="overflow-hidden bg-primary text-primary-foreground">
          <CardContent className="flex flex-col items-center gap-6 p-12 text-center">
            <h2 className="text-3xl font-bold">Ready to Join the Greenwood Family?</h2>
            <p className="max-w-xl opacity-90">
              Take the first step toward an exceptional education. Applications for the upcoming
              academic year are now open.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/admissions">Start Your Application <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
