"use client";
import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Animated statistic — counts up when scrolled into view. Accepts a display
 * string like "2,400+" or "98%"; extracts the number, animates it, and
 * re-applies the prefix/suffix so formatting is preserved.
 */
export function AnimatedStat({ value, label }: { value: string; label: string }) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const [display, setDisplay] = React.useState(reduce ? value : startValue(value));

  React.useEffect(() => {
    if (reduce) return;
    const el = ref.current; if (!el) return;
    const num = parseFloat(value.replace(/[^0-9.]/g, ""));
    if (isNaN(num)) { setDisplay(value); return; }
    const prefix = value.slice(0, value.search(/[0-9]/));
    const suffix = value.slice(value.search(/[0-9.]+/) + String(num).length);
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      let raf = 0; const start = performance.now(); const dur = 1400;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        const cur = num * eased;
        const formatted = Number.isInteger(num) ? Math.round(cur).toLocaleString() : cur.toFixed(1);
        setDisplay(`${prefix}${formatted}${suffix}`);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value, reduce]);

  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="text-3xl font-semibold tracking-tight text-gradient sm:text-4xl lg:text-5xl tabular-nums break-words">{display}</div>
      <div className="mt-2 text-xs text-muted-foreground sm:text-sm">{label}</div>
    </motion.div>
  );
}

function startValue(v: string) {
  return v.replace(/[0-9.]+/, "0");
}
