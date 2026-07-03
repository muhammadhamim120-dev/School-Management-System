"use client";
import * as React from "react";
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------------------ *
 * BlurText — the signature Antigravity headline reveal.
 * Splits text into words that fade + rise + un-blur in sequence.
 * ------------------------------------------------------------------ */
export function BlurText({
  text,
  as: Tag = "h1",
  className,
  delay = 0,
  stagger = 0.08,
  once = true,
  highlight,
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
  /** A word (or phrase) inside `text` to paint with the gradient accent. */
  highlight?: string;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  const MotionTag = motion[Tag];

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };
  const word: Variants = {
    hidden: { opacity: 0, y: "0.5em", filter: "blur(12px)" },
    show: { opacity: 1, y: "0em", filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
  };

  if (reduce) {
    return <Tag className={className}>{text}</Tag>;
  }

  const isHighlighted = (w: string) =>
    highlight ? highlight.split(" ").includes(w.replace(/[.,!?]/g, "")) : false;

  return (
    <MotionTag
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-10%" }}
      className={className}
    >
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <motion.span variants={word} className={cn("inline-block will-change-transform", isHighlighted(w) && "text-gradient")}>
            {w}
          </motion.span>
          {i < words.length - 1 && " "}
        </React.Fragment>
      ))}
    </MotionTag>
  );
}

/* ------------------------------------------------------------------ *
 * Parallax — scroll-linked vertical drift. Wrap any layer; it moves
 * at a fraction of scroll speed for cinematic depth.
 * ------------------------------------------------------------------ */
export function Parallax({
  children,
  speed = 0.3,
  className,
}: {
  children: React.ReactNode;
  /** Positive = moves up as you scroll down; try 0.15–0.5. */
  speed?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${-speed * 100}%`]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * ScrollReveal — fade + rise as the element enters the viewport, with
 * a subtle blur lift. The scroll-linked cousin of a plain fade.
 * ------------------------------------------------------------------ */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 40,
  blur = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  blur?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y, filter: blur ? "blur(8px)" : "blur(0px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.8, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ *
 * ScrollRevealGroup / Item — staggered version for grids & lists.
 * ------------------------------------------------------------------ */
export function ScrollRevealGroup({ children, className, stagger = 0.1 }: { children: React.ReactNode; className?: string; stagger?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10%" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
export function ScrollRevealItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={
        reduce
          ? { hidden: {}, show: {} }
          : {
              hidden: { opacity: 0, y: 32, filter: "blur(6px)" },
              show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
            }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
