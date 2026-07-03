"use client";
import * as React from "react";
import { useI18n } from "@/components/i18n-provider";
import { PageHero } from "@/components/public/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form-field";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Reveal } from "@/components/public/section";

const info = [
  { icon: MapPin, label: "Address", value: "123 Education Blvd, Springfield, 45001" },
  { icon: Phone, label: "Phone", value: "+1 555 0100" },
  { icon: Mail, label: "Email", value: "info@greenwood.edu" },
  { icon: Clock, label: "Office Hours", value: "Mon–Fri, 8:00 AM – 4:00 PM" },
];

export default function ContactPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [form, setForm] = React.useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Demo: no mail backend configured — simulate a successful submission.
    setTimeout(() => {
      toast({ variant: "success", title: "Message sent!", description: "We'll get back to you shortly." });
      setForm({ name: "", email: "", subject: "", message: "" });
      setSubmitting(false);
    }, 600);
  };

  return (
    <>
      <PageHero eyebrow={t("public.contact")} title={t("contact.title")} subtitle={t("contact.subtitle")} />
      <section className="container grid gap-8 py-12 sm:gap-10 sm:py-16 lg:grid-cols-2">
        <Reveal>
          <div className="space-y-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{t("contact.getInTouch")}</h2>
            <p className="text-muted-foreground">
              Whether you&apos;re a prospective family, current parent, or community partner, our team is
              here to help.
            </p>
            <div className="space-y-3">
              {info.map((i) => {
                const Icon = i.icon;
                return (
                  <div key={i.label} className="glow lift flex items-start gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 shadow-soft backdrop-blur">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{i.label}</p>
                      <p className="text-sm text-muted-foreground">{i.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-float backdrop-blur">
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Full Name" required>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </Field>
              <Field label="Email" required>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </Field>
              <Field label="Subject">
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </Field>
              <Field label="Message" required>
                <Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
              </Field>
              <Button type="submit" className="press w-full" disabled={submitting}>
                {submitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </Reveal>
      </section>
    </>
  );
}
