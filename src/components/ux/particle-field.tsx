"use client";
import * as React from "react";

/**
 * ParticleField — premium "AntiGravity" constellation field on a <canvas>.
 * ───────────────────────────────────────────────────────────────────────────
 * Visual language (purple → blue → cyan, matching the design tokens):
 *   • Weightless particles drifting in a layered, parallaxed depth field.
 *   • A constellation network: nearby particles are linked by gradient hairlines
 *     that fade with distance.
 *   • Interactive cursor: particles are gently repelled from the pointer (the
 *     "anti-gravity" well) and the closest ones link to it with brighter lines.
 *   • A few larger "hero" orbs with soft bloom, plus fine dust for depth.
 *   • Subtle per-particle twinkle.
 *
 * Performance:
 *   • Device-pixel-ratio capped at 2.
 *   • Glow is drawn from pre-rendered sprites (no per-particle radial gradients
 *     or shadowBlur). Links use additive-free strokes with per-line alpha.
 *   • Particle count scales with viewport area and is capped (far fewer on
 *     mobile); link work is O(n²) only over the capped foreground set.
 *   • rAF loop pauses when the tab is hidden; velocity uses damping so the field
 *     settles instead of accelerating.
 *   • prefers-reduced-motion → one static frame, no loop, no pointer handlers.
 *
 * Lazy-loaded (next/dynamic, ssr:false) so it never touches SSR or the initial
 * bundle.
 */

const HUE_MIN = 205; // cyan-blue
const HUE_MAX = 285; // violet
const HUE_BUCKETS = 7;
const SPRITE = 64;

const LINK_DIST = 132; // px — particle↔particle link threshold
const CURSOR_LINK_DIST = 190; // px — particle↔cursor link threshold
const REPEL_RADIUS = 150; // px — anti-gravity well radius
const REPEL_FORCE = 900; // px/s² at the center of the well

type Particle = {
  x: number;
  y: number;
  z: number; // depth 0.3 (far) .. 1 (near)
  dvx: number; // constant weightless drift (px/s)
  dvy: number;
  vx: number; // impulse velocity (decays), from cursor repulsion (px/s)
  vy: number;
  r: number; // core radius
  glow: number; // sprite footprint multiplier
  hue: number;
  hueBucket: number;
  base: number; // base alpha
  tw: number; // twinkle phase
  twSpeed: number;
  hero: boolean;
};

function buildSprites(): HTMLCanvasElement[] {
  const sprites: HTMLCanvasElement[] = [];
  for (let b = 0; b < HUE_BUCKETS; b++) {
    const hue = HUE_MIN + ((HUE_MAX - HUE_MIN) * b) / (HUE_BUCKETS - 1);
    const c = document.createElement("canvas");
    c.width = c.height = SPRITE;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(SPRITE / 2, SPRITE / 2, 0, SPRITE / 2, SPRITE / 2, SPRITE / 2);
    grd.addColorStop(0, `hsla(${hue}, 95%, 72%, 1)`);
    grd.addColorStop(0.25, `hsla(${hue}, 92%, 64%, 0.55)`);
    grd.addColorStop(0.6, `hsla(${hue}, 90%, 60%, 0.16)`);
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

    // Smoothed parallax offset (normalized ~[-0.5,0.5]) + live pointer position.
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    let mouseX = -9999;
    let mouseY = -9999;
    let mouseActive = false;
    const PARALLAX = 46;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    function makeParticle(): Particle {
      const z = rand(0.3, 1);
      const hero = Math.random() < 0.16;
      const hue = rand(HUE_MIN, HUE_MAX);
      const speed = rand(4, 13);
      const ang = rand(0, Math.PI * 2);
      return {
        x: rand(0, width),
        y: rand(0, height),
        z,
        // gentle weightless drift with a faint upward bias
        dvx: Math.cos(ang) * speed * z,
        dvy: Math.sin(ang) * speed * z - rand(2, 8) * z,
        vx: 0,
        vy: 0,
        r: (hero ? rand(2.2, 3.4) : rand(0.8, 1.8)) * (0.6 + z * 0.6),
        glow: hero ? rand(11, 15) : rand(6, 9),
        hue,
        hueBucket: Math.min(HUE_BUCKETS - 1, Math.floor(((hue - HUE_MIN) / (HUE_MAX - HUE_MIN)) * HUE_BUCKETS)),
        base: (hero ? rand(0.55, 0.85) : rand(0.28, 0.6)) * (0.5 + z * 0.5),
        tw: rand(0, Math.PI * 2),
        twSpeed: rand(0.4, 1.3),
        hero,
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

      const area = width * height;
      const base = Math.round(area / 20000);
      const cap = width < 640 ? 34 : 96;
      const count = Math.max(22, Math.min(cap, base));
      particles = Array.from({ length: count }, makeParticle);
    }

    // Render position including eased parallax (depth-scaled).
    function px(p: Particle) {
      return p.x + curX * PARALLAX * p.z;
    }
    function py(p: Particle) {
      return p.y + curY * PARALLAX * p.z;
    }

    function step(dt: number) {
      for (const p of particles) {
        // Anti-gravity well: push away from the pointer.
        if (mouseActive) {
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const d2 = dx * dx + dy * dy;
          if (d2 < REPEL_RADIUS * REPEL_RADIUS && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = (1 - d / REPEL_RADIUS) * REPEL_FORCE;
            p.vx += (dx / d) * f * dt;
            p.vy += (dy / d) * f * dt;
          }
        }
        // Integrate drift + impulse; damp the impulse so the field settles.
        p.x += (p.dvx + p.vx) * dt;
        p.y += (p.dvy + p.vy) * dt;
        p.vx *= 0.92;
        p.vy *= 0.92;

        // Wrap around edges with a soft margin for a continuous field.
        const m = 30;
        if (p.x < -m) p.x = width + m;
        else if (p.x > width + m) p.x = -m;
        if (p.y < -m) p.y = height + m;
        else if (p.y > height + m) p.y = -m;
      }
    }

    function drawLinks(t: number) {
      ctx!.lineWidth = 1;
      // Constellation links between nearby particles.
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const ax = px(a);
        const ay = py(a);
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const bx = px(b);
          const by = py(b);
          const dx = ax - bx;
          const dy = ay - by;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK_DIST * LINK_DIST) continue;
          const d = Math.sqrt(d2);
          const alpha = (1 - d / LINK_DIST) * 0.22 * Math.min(a.z, b.z);
          if (alpha < 0.012) continue;
          const hue = (a.hue + b.hue) / 2;
          ctx!.strokeStyle = `hsla(${hue}, 90%, 66%, ${alpha})`;
          ctx!.beginPath();
          ctx!.moveTo(ax, ay);
          ctx!.lineTo(bx, by);
          ctx!.stroke();
        }
      }
      // Brighter links from nearby particles to the pointer.
      if (mouseActive) {
        for (const p of particles) {
          const dx = px(p) - mouseX;
          const dy = py(p) - mouseY;
          const d2 = dx * dx + dy * dy;
          if (d2 > CURSOR_LINK_DIST * CURSOR_LINK_DIST) continue;
          const d = Math.sqrt(d2);
          const alpha = (1 - d / CURSOR_LINK_DIST) * 0.4;
          ctx!.strokeStyle = `hsla(${p.hue}, 95%, 70%, ${alpha})`;
          ctx!.beginPath();
          ctx!.moveTo(px(p), py(p));
          ctx!.lineTo(mouseX, mouseY);
          ctx!.stroke();
        }
      }
      void t;
    }

    function drawGlows(t: number) {
      ctx!.globalCompositeOperation = "lighter";
      for (const p of particles) {
        const twinkle = reduced ? 1 : 0.62 + 0.38 * Math.sin(t * p.twSpeed + p.tw);
        const size = p.r * p.glow;
        ctx!.globalAlpha = Math.max(0, Math.min(1, p.base * twinkle));
        ctx!.drawImage(sprites[p.hueBucket], px(p) - size / 2, py(p) - size / 2, size, size);
      }
      ctx!.globalAlpha = 1;
      ctx!.globalCompositeOperation = "source-over";
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, width, height);
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      drawLinks(t);
      drawGlows(t);
    }

    resize();

    // Reduced motion: one static frame, no loop, no pointer handlers.
    if (reduced) {
      draw(0);
      const onResizeStatic = () => {
        resize();
        draw(0);
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
      step(dt);
      draw(now / 1000);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      mouseActive = true;
      targetX = e.clientX / window.innerWidth - 0.5;
      targetY = e.clientY / window.innerHeight - 0.5;
    };
    const onLeave = () => {
      mouseActive = false;
      mouseX = mouseY = -9999;
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
    window.addEventListener("mouseout", onLeave, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ opacity: 0.95 }}
    />
  );
}

export default ParticleField;
