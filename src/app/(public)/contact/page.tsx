"use client";
import * as React from "react";
import { PageHero } from "@/components/public/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form-field";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const info = [
  { icon: MapPin, label: "Address", value: "123 Education Blvd, Springfield, 45001" },
  { icon: Phone, label: "Phone", value: "+1 555 0100" },
  { icon: Mail, label: "Email", value: "info@greenwood.edu" },
  { icon: Clock, label: "Office Hours", value: "Mon–Fri, 8:00 AM – 4:00 PM" },
];

export default function ContactPage() {
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
      <PageHero title="Contact Us" subtitle="We'd love to hear from you. Reach out with any questions." />
      <section className="container grid gap-10 py-16 lg:grid-cols-2">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Get in Touch</h2>
          <p className="text-muted-foreground">
            Whether you&apos;re a prospective family, current parent, or community partner, our team is
            here to help.
          </p>
          <div className="space-y-4">
            {info.map((i) => {
              const Icon = i.icon;
              return (
                <div key={i.label} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
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

        <Card>
          <CardContent className="p-6">
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
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
