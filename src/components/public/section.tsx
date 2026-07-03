"use client";
import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlurText } from "@/components/public/cinematic";

const ease = [0.22, 1, 0.36, 1] as const;

/** Scroll-triggered reveal — fades + rises into view once. */
export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 32, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.8, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Staggered reveal container for grids. */
export function RevealGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
export function RevealItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 28, filter: "blur(6px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Floating glass CTA band. */
export function FloatingCTA({ title, description, primaryHref, primaryLabel, secondaryHref, secondaryLabel }: {
  title: string; description?: string;
  primaryHref: string; primaryLabel: string;
  secondaryHref?: string; secondaryLabel?: string;
}) {
  return (
    <section className="container py-14 sm:py-20 lg:py-24">
      <Reveal>
        <div className="glow relative overflow-hidden rounded-3xl border border-border/60 glass p-6 text-center shadow-float sm:p-12 lg:p-16">
          <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-chart-3/20 blur-3xl" style={{ background: "hsl(var(--chart-3) / 0.18)", filter: "blur(48px)" }} />
          <div className="relative">
            <BlurText as="h2" text={title} className="mx-auto max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl" />
            {description && <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">{description}</p>}
            <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center">
              <Link href={primaryHref} className="press glow inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-elevated transition-transform hover:scale-[1.02]">
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </Link>
              {secondaryHref && secondaryLabel && (
                <Link href={secondaryHref} className="press inline-flex items-center justify-center rounded-xl border border-border bg-card/60 px-6 py-3 text-sm font-medium transition-colors hover:bg-accent">
                  {secondaryLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/** Section heading with eyebrow. */
export function SectionHeading({ eyebrow, title, description, className }: { eyebrow?: string; title: string; description?: string; className?: string }) {
  return (
    <Reveal className={cn("mx-auto mb-10 max-w-2xl text-center sm:mb-12", className)}>
      {eyebrow && <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary sm:text-sm">{eyebrow}</div>}
      <BlurText as="h2" text={title} className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl" />
      {description && <p className="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-lg">{description}</p>}
    </Reveal>
  );
}
