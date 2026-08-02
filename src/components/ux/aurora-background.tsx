"use client";
import * as React from "react";
import dynamic from "next/dynamic";

// Lazy, client-only: the Canvas particle field never enters SSR or the initial
// bundle. It renders behind the aurora blobs and self-disables on reduced motion.
const ParticleField = dynamic(
  () => import("./particle-field").then((m) => m.ParticleField),
  { ssr: false },
);

/**
 * Aurora animated background — layered mesh-gradient blobs that drift slowly,
 * plus an optional mouse-parallax shift. Fixed behind all content, GPU-friendly
 * (transform/opacity only), and quiet in dark mode. Respects reduced motion.
 */
export function AuroraBackground({ parallax = true }: { parallax?: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!parallax) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 24;
        const y = (e.clientY / window.innerHeight - 0.5) * 24;
        el.style.setProperty("--px", `${x}px`);
        el.style.setProperty("--py", `${y}px`);
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, [parallax]);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="aurora-blob aurora-1" />
      <div className="aurora-blob aurora-2" />
      <div className="aurora-blob aurora-3" />
      {/* AntiGravity floating particles (lazy, canvas) */}
      <ParticleField />
      {/* fine grid + vignette for depth */}
      <div className="absolute inset-0 bg-grid opacity-[0.35] dark:opacity-[0.15]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
    </div>
  );
}
