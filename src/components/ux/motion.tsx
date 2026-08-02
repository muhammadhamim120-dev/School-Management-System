"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Page transition wrapper — fade + rise. Keyed on the pathname so the entrance
 * animation replays on every client-side navigation, not just first mount.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container + item for grids/lists. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  );
}
export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return <motion.div variants={staggerItem} className={className}>{children}</motion.div>;
}

/** Animated number counter — eases from 0 to value on mount / value change. */
export function AnimatedCounter({ value, duration = 1.1, format }: { value: number; duration?: number; format?: (n: number) => string }) {
  const [display, setDisplay] = React.useState(0);
  const reduce = useReducedMotion();
  React.useEffect(() => {
    if (reduce) { setDisplay(value); return; }
    let raf = 0; const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(from + (value - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduce]);
  const n = Math.round(display);
  return <>{format ? format(n) : n.toLocaleString()}</>;
}
