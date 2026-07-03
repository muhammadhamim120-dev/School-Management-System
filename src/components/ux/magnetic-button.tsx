"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Magnetic + ripple button. The content nudges toward the cursor on hover
 * (magnetic), and a ripple emanates from the click point. Purely visual — wraps
 * a native button so existing onClick handlers work unchanged.
 */
export function MagneticButton({
  children, className, strength = 0.35, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { strength?: number }) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reduce) return;
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * strength;
    const y = (e.clientY - r.top - r.height / 2) * strength;
    el.style.transform = `translate(${x}px, ${y}px)`;
  };
  const reset = () => { const el = ref.current; if (el) el.style.transform = ""; };

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (el && !reduce) {
      const r = el.getBoundingClientRect();
      const span = document.createElement("span");
      span.className = "ripple";
      const size = Math.max(r.width, r.height);
      span.style.width = span.style.height = `${size}px`;
      span.style.left = `${e.clientX - r.left - size / 2}px`;
      span.style.top = `${e.clientY - r.top - size / 2}px`;
      el.appendChild(span);
      setTimeout(() => span.remove(), 650);
    }
    props.onClick?.(e);
  };

  return (
    <button
      ref={ref}
      {...props}
      onMouseMove={onMove}
      onMouseLeave={reset}
      onClick={onClick}
      className={cn("ripple-host transition-transform duration-200 ease-out", className)}
    >
      {children}
    </button>
  );
}
