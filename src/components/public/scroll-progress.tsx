"use client";
import { motion, useScroll, useSpring } from "framer-motion";

/** Thin gradient bar that fills with scroll progress — a subtle cinematic cue. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-gradient-to-r from-primary via-chart-3 to-primary"
      aria-hidden
    />
  );
}
