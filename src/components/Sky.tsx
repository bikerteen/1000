"use client";

import { useEffect, useRef, useState } from "react";
import { STATUS_META, type Shot, type Status } from "@/lib/types";
import { pad } from "@/lib/format";

// Glow colour per outcome, as "r,g,b".
const GLOW: Record<Status, string> = {
  pending: "243,240,232",
  accepted: "212,255,46",
  rejected: "255,61,31",
  no_answer: "160,156,146",
  missed: "120,142,255",
};

const TAU = Math.PI * 2;

/** Seeded PRNG so the sky is the same every visit — star 17 is always star 17. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Star = { x: number; y: number; z: number; r: number; a: number; ph: number; sp: number };
type Lit = { x: number; y: number; shot: Shot };

function makeSky(goal: number): Star[] {
  const rnd = mulberry32(1000);
  return Array.from({ length: goal }, () => ({
    x: rnd(),
    y: 0.04 + rnd() * 0.92,
    z: 0.25 + rnd() * 0.75,
    r: 0.45 + rnd() * 0.85,
    a: 0.1 + rnd() * 0.32,
    ph: rnd() * TAU,
    sp: 0.4 + rnd() * 1.4,
  }));
}

/**
 * 1000 stars — one per shot. Taken shots glow in their outcome colour and are
 * joined, in order, into a constellation. Hover (or tap) a lit star to see it.
 */
export default function Sky({
  shots,
  goal,
  onPick,
}: {
  shots: Shot[];
  goal: number;
  onPick: (s: Shot) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const litRef = useRef<Lit[]>([]);
  const pointer = useRef({ x: -9999, y: -9999, nx: 0, ny: 0 });
  const [hover, setHover] = useState<Lit | null>(null);
  const hoverRef = useRef<Lit | null>(null);
  const orderedRef = useRef<Shot[]>([]);

  // The draw loop reads these refs, so it never needs restarting.
  useEffect(() => {
    hoverRef.current = hover;
  }, [hover]);
  useEffect(() => {
    orderedRef.current = [...shots].sort((a, b) => a.n - b.n);
  }, [shots]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const stars = makeSky(goal);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    const start = performance.now();
    const smooth = { x: 0, y: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const frame = (now: number) => {
      const t = reduce ? 1e6 : now - start;
      const intro = Math.min(t / 1800, 1);
      const p = pointer.current;
      smooth.x += (p.nx - smooth.x) * 0.05;
      smooth.y += (p.ny - smooth.y) * 0.05;

      ctx.clearRect(0, 0, w, h);
      const shotsNow = orderedRef.current;
      const lit: Lit[] = [];

      ctx.fillStyle = "#f3f0e8";
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const drift = reduce ? 0 : t * 0.0000025 * s.z;
        const x = (((s.x + drift) % 1) * w) + smooth.x * 28 * s.z;
        const y = s.y * h + smooth.y * 18 * s.z;
        if (shotsNow[i]) {
          lit.push({ x, y, shot: shotsNow[i] });
          continue;
        }
        // Dim, unclaimed stars. They brighten under the cursor like a torch.
        const twinkle = 0.6 + 0.4 * Math.sin(t * 0.001 * s.sp + s.ph);
        const near = Math.max(0, 1 - Math.hypot(x - p.x, y - p.y) / 200);
        ctx.globalAlpha = Math.min(1, (s.a * twinkle + near * near * 0.6) * intro);
        ctx.beginPath();
        ctx.arc(x, y, s.r * (1 + near * 0.7), 0, TAU);
        ctx.fill();
      }

      // Lit stars arrive one by one after the sky settles.
      const since = t - 1100;
      const shown = reduce ? lit.length : Math.min(lit.length, Math.max(0, Math.floor(since / 110) + 1));

      // Constellation: the path from shot №1 to now.
      if (shown > 1) {
        ctx.globalAlpha = 0.085;
        ctx.strokeStyle = "#f3f0e8";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(lit[0].x, lit[0].y);
        for (let k = 1; k < shown; k++) ctx.lineTo(lit[k].x, lit[k].y);
        ctx.stroke();
      }

      const hovered = hoverRef.current?.shot.id;
      for (let k = 0; k < shown; k++) {
        const { x, y, shot } = lit[k];
        const age = reduce ? 1 : Math.min((since - k * 110) / 700, 1);
        const pop = 1 - Math.pow(1 - Math.max(age, 0), 3);
        const pulse = 0.85 + 0.15 * Math.sin(t * 0.0018 + k);
        const rgb = GLOW[shot.status];
        const isHover = shot.id === hovered;
        const glowR = (isHover ? 26 : 16) * pop * pulse;

        const g = ctx.createRadialGradient(x, y, 0, x, y, glowR);
        g.addColorStop(0, `rgba(${rgb},0.85)`);
        g.addColorStop(0.25, `rgba(${rgb},0.35)`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, glowR, 0, TAU);
        ctx.fill();

        ctx.fillStyle = `rgb(${rgb})`;
        ctx.beginPath();
        ctx.arc(x, y, 2.1 * pop, 0, TAU);
        ctx.fill();

        if (isHover) {
          ctx.strokeStyle = `rgba(${rgb},0.9)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, TAU);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "#f3f0e8";
      litRef.current = lit.slice(0, shown);

      if (visible && !reduce) raf = requestAnimationFrame(frame);
    };

    resize();
    frame(performance.now());
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) frame(performance.now());
    });
    ro.observe(canvas);

    // Stop drawing once the hero scrolls away.
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [goal]);

  const nearest = (x: number, y: number, radius: number) => {
    let best: Lit | null = null;
    let bestD = radius;
    for (const l of litRef.current) {
      const d = Math.hypot(l.x - x, l.y - y);
      if (d < bestD) {
        best = l;
        bestD = d;
      }
    }
    return best;
  };

  const local = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className={`absolute inset-0 h-full w-full ${hover ? "cursor-pointer" : ""}`}
        onPointerMove={(e) => {
          const { x, y, w, h } = local(e);
          pointer.current = { x, y, nx: x / w - 0.5, ny: y / h - 0.5 };
          if (e.pointerType === "mouse") {
            const n = nearest(x, y, 22);
            if (n?.shot.id !== hoverRef.current?.shot.id) setHover(n);
          }
        }}
        onPointerLeave={() => {
          pointer.current = { ...pointer.current, x: -9999, y: -9999 };
          setHover(null);
        }}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const n = nearest(e.clientX - r.left, e.clientY - r.top, 30);
          if (n) onPick(n.shot);
        }}
      />
      {hover && (
        <div
          className="pointer-events-none absolute z-20 max-w-64 -translate-x-1/2 border border-paper/15 bg-ink/80 px-3 py-2 backdrop-blur-md"
          style={{ left: hover.x, top: hover.y + 18 }}
        >
          <p className="kicker text-paper/60">
            №{pad(hover.shot.n)} · {STATUS_META[hover.shot.status].label}
          </p>
          <p className="mt-0.5 font-serif text-lg italic leading-tight text-paper">
            {hover.shot.title}
          </p>
        </div>
      )}
    </>
  );
}
