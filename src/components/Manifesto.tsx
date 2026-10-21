"use client";

import { useEffect, useRef } from "react";

const WORDS: { w: string; cls?: string }[] = [
  ..."I’m asking for the impossible — a thousand times, over ten years."
    .split(" ")
    .map((w) => ({ w })),
  { w: "Every" },
  { w: "no", cls: "italic text-signal" },
  ..."is a receipt that I tried.".split(" ").map((w) => ({ w })),
  { w: "Every" },
  { w: "yes", cls: "italic text-acid" },
  { w: "is" },
  { w: "the" },
  { w: "moon.", cls: "italic" },
];

/** Pinned statement that lights up word by word as you scroll through it. */
export default function Manifesto({ owner }: { owner: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--p", "1");
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const travel = r.height - window.innerHeight;
      const p = Math.min(Math.max((-r.top + window.innerHeight * 0.35) / travel, 0), 1);
      el.style.setProperty("--p", p.toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section ref={ref} className="relative h-[210svh] bg-ink text-paper">
      <div className="sticky top-0 flex h-svh flex-col justify-center gap-10 px-5 sm:px-10">
        <p className="kicker text-paper/40">The dare</p>
        <p
          className="max-w-[22ch] font-serif text-[clamp(2.4rem,6.2vw,6.6rem)] leading-[1.02] tracking-[-0.015em]"
          style={{ "--n": WORDS.length } as React.CSSProperties}
        >
          {WORDS.map(({ w, cls }, i) => (
            <span
              key={i}
              className={`word ${cls ?? ""}`}
              style={{ "--i": i } as React.CSSProperties}
            >
              {w}{" "}
            </span>
          ))}
        </p>
        <p className="kicker text-paper/50">— {owner}, London</p>
      </div>
    </section>
  );
}
