"use client";
import * as React from "react";

/**
 * ParticleField — "AntiGravity" futuristic floating particles on a <canvas>.
 * ───────────────────────────────────────────────────────────────────────────
 * • Zero dependencies (raw Canvas 2D), fixed behind all content.
 * • Purple→blue palette matching the design tokens (--primary / --chart-3).
 * • Particles drift slowly upward (anti-gravity) with a gentle horizontal sway.
 * • Depth-based mouse parallax: nearer particles shift more than far ones.
 * • Performance:
 *     - Device-pixel-ratio capped at 2.
 *     - Glow is drawn from a handful of pre-rendered sprites (no per-particle
 *       radial gradients / shadowBlur), so the per-frame cost is a few dozen
 *       drawImage calls.
 *     - Particle count scales with viewport area and is capped (fewer on mobile).
 *     - The rAF loop pauses when the tab is hidden.
 * • Respects prefers-reduced-motion: renders ONE static frame, no animation loop.
 *
 * Designed to be lazy-loaded (next/dynamic, ssr:false) so it never touches SSR
 * or the initial bundle.
 */

const HUE_MIN = 214; // blue
const HUE_MAX = 280; // violet
const HUE_BUCKETS = 6;
const SPRITE = 64; // sprite canvas size in px

type Particle = {
  x: number;
  y: number;
  z: number; // depth 0.35 (far) .. 1 (near)
  r: number; // base radius
  vy: number; // upward speed (px/sec)
  sway: number; // horizontal sway amplitude (px)
  swaySpeed: number;
  phase: number;
  hueBucket: number;
  alpha: number;
};

function buildSprites(): HTMLCanvasElement[] {
  const sprites: HTMLCanvasElement[] = [];
  for (let b = 0; b < HUE_BUCKETS; b++) {
    const hue = HUE_MIN + ((HUE_MAX - HUE_MIN) * b) / (HUE_BUCKETS - 1);
    const c = document.createElement("canvas");
    c.width = c.height = SPRITE;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(SPRITE / 2, SPRITE / 2, 0, SPRITE / 2, SPRITE / 2, SPRITE / 2);
    grd.addColorStop(0, `hsla(${hue}, 92%, 68%, 0.95)`);
    grd.addColorStop(0.35, `hsla(${hue}, 90%, 62%, 0.45)`);
    grd.addColorStop(1, `hsla(${hue}, 90%, 60%, 0)`);
    g.fillStyle = grd;
    g.fillRect(0, 0, SPRITE, SPRITE);
    sprites.push(c);
  }
  return sprites;
}

export function ParticleField() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const sprites = buildSprites();

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    // Smoothed mouse offset, normalized to roughly [-0.5, 0.5].
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    const PARALLAX = 42; // px of shift at z=1

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    function makeParticle(initial: boolean): Particle {
      const z = rand(0.35, 1);
      return {
        x: rand(0, width),
        y: initial ? rand(0, height) : height + rand(0, 40),
        z,
        r: rand(1, 2.4) * z,
        vy: rand(6, 20) * z, // px/sec upward
        sway: rand(6, 22),
        swaySpeed: rand(0.15, 0.5),
        phase: rand(0, Math.PI * 2),
        hueBucket: Math.floor(rand(0, HUE_BUCKETS)),
        alpha: rand(0.25, 0.7),
      };
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Count scales with area, capped; fewer on small screens.
      const area = width * height;
      const base = Math.round(area / 22000);
      const cap = width < 640 ? 30 : 72;
      const count = Math.max(18, Math.min(cap, base));
      particles = Array.from({ length: count }, () => makeParticle(true));
    }

    function draw(dtSec: number, t: number) {
      ctx!.clearRect(0, 0, width, height);
      ctx!.globalCompositeOperation = "lighter"; // additive glow

      // Ease the parallax offset toward the target.
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;

      for (const p of particles) {
        if (!reduced) {
          p.y -= p.vy * dtSec;
          p.x += Math.sin(t * p.swaySpeed + p.phase) * p.sway * dtSec;
          if (p.y < -8) {
            p.y = height + rand(0, 30);
            p.x = rand(0, width);
          }
        }
        const ox = curX * PARALLAX * p.z;
        const oy = curY * PARALLAX * p.z;
        const size = p.r * 9; // sprite footprint (glow is larger than core)
        ctx!.globalAlpha = p.alpha;
        ctx!.drawImage(
          sprites[p.hueBucket],
          p.x + ox - size / 2,
          p.y + oy - size / 2,
          size,
          size,
        );
      }
      ctx!.globalAlpha = 1;
      ctx!.globalCompositeOperation = "source-over";
    }

    resize();

    // Reduced motion: one static frame, no loop, no listeners.
    if (reduced) {
      draw(0, 0);
      const onResizeStatic = () => {
        resize();
        draw(0, 0);
      };
      window.addEventListener("resize", onResizeStatic, { passive: true });
      return () => window.removeEventListener("resize", onResizeStatic);
    }

    let raf = 0;
    let last = performance.now();
    let running = true;

    function frame(now: number) {
      if (!running) return;
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05; // clamp after tab refocus / long frames
      draw(dt, now / 1000);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX / window.innerWidth - 0.5;
      targetY = e.clientY / window.innerHeight - 0.5;
    };
    const onResize = () => resize();
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ opacity: 0.9 }}
    />
  );
}

export default ParticleField;
