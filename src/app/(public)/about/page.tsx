import { PageHero } from "@/components/public/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Heart, Users } from "lucide-react";

const values = [
  { icon: Target, title: "Excellence", desc: "We pursue the highest standards in everything we do." },
  { icon: Heart, title: "Compassion", desc: "We lead with empathy, kindness, and respect for all." },
  { icon: Users, title: "Community", desc: "We grow together through collaboration and inclusion." },
  { icon: Eye, title: "Vision", desc: "We prepare students to thrive in a changing world." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero title="About Greenwood" subtitle="A legacy of academic excellence and character education spanning over two decades." />
      <section className="container grid items-center gap-10 py-16 lg:grid-cols-2">
        <img
          src="https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80"
          alt="School building"
          className="rounded-2xl border shadow-lg"
        />
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Our Story</h2>
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
      </section>

      <section className="bg-muted/40 py-16">
        <div className="container grid gap-8 md:grid-cols-2">
          <Card>
            <CardContent className="space-y-3 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Our Mission</h3>
              <p className="text-muted-foreground">
                To provide a nurturing, challenging, and inclusive learning environment that empowers
                every student to achieve academic excellence and become a responsible global citizen.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Eye className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Our Vision</h3>
              <p className="text-muted-foreground">
                To be a leading educational institution recognized for innovation, integrity, and the
                holistic development of future-ready leaders.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-bold">Our Core Values</h2>
          <p className="mt-3 text-muted-foreground">The principles that guide everything we do.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <Card key={v.title} className="text-center transition-shadow hover:shadow-lg">
                <CardContent className="space-y-3 p-6">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </>
  );
}
