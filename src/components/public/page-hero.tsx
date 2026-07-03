"use client";
import { motion } from "framer-motion";

/**
 * Cinematic interior-page hero. Sits below the fixed floating navbar (pt to
 * clear it), with an animated headline and subtle floating accent orbs.
 */
export function PageHero({ title, subtitle, eyebrow }: { title: string; subtitle?: string; eyebrow?: string }) {
  return (
    <section className="relative overflow-hidden pt-28 pb-12 sm:pt-36 sm:pb-16 lg:pt-40 lg:pb-20">
      {/* floating accent orbs */}
      <div className="pointer-events-none absolute left-1/4 top-24 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-40 h-48 w-48 rounded-full" style={{ background: "hsl(var(--chart-3) / 0.14)", filter: "blur(56px)" }} />
      <div className="container relative text-center">
        {eyebrow && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="mb-4 inline-flex items-center rounded-full border border-border/60 glass px-3 py-1 text-xs font-medium text-primary sm:px-4 sm:py-1.5 sm:text-sm"
          >
            {eyebrow}
          </motion.div>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:mt-5 sm:text-lg"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  );
}
