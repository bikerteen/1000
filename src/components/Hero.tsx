"use client";

import { useRef } from "react";
import type { Shot } from "@/lib/types";
import { fmtDate, pad } from "@/lib/format";
import Sky from "./Sky";

/** The opening: a night sky of a thousand shots, and a moon to land on. */
export default function Hero({
  shots,
  goal,
  owner,
  today,
  endsOn,
  onNew,
  onPick,
}: {
  shots: Shot[];
  goal: number;
  owner: string;
  today: string;
  endsOn: string;
  onNew: () => void;
  onPick: (s: Shot) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const total = shots.length;

  // Moon drifts gently against the cursor.
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", String((e.clientX - r.left) / r.width - 0.5));
    el.style.setProperty("--my", String((e.clientY - r.top) / r.height - 0.5));
  };

  return (
    <section
      ref={ref}
      onPointerMove={onMove}
      className="relative isolate h-svh min-h-[620px] overflow-hidden bg-ink text-paper"
    >
      {/* Paint order (no z-index, so the title can blend with the moon): sky → moon → type. */}
      <Sky shots={shots} goal={goal} onPick={onPick} />

      <div aria-hidden className="moon-wrap pointer-events-none absolute">
        <div className="moon animate-moonrise size-full rounded-full" />
      </div>

      <div className="pointer-events-none relative flex h-full flex-col justify-between px-5 py-5 sm:px-10 sm:py-8">
        {/* Top rail */}
        <div className="animate-fade flex items-baseline justify-between gap-4 [animation-delay:200ms]">
          <span className="font-serif text-xl italic sm:text-2xl">{owner}</span>
          <span className="kicker hidden text-paper/50 md:inline">
            The 1000 Rejections Project
          </span>
          <span className="kicker text-paper/50">
            №{pad(total)} · London · {fmtDate(today)}
          </span>
        </div>

        {/* Title */}
        <div className="mix-blend-difference">
          <p className="kicker mb-5 overflow-hidden text-paper/70 sm:mb-7">
            <span className="animate-reveal block [animation-delay:300ms]">
              A ten-year dare · {fmtDate(today)} — {fmtDate(endsOn)}
            </span>
          </p>
          <h1 className="font-serif text-[15.5vw] leading-[0.92] tracking-[-0.02em] sm:text-[9.2vw]">
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="animate-reveal block [animation-delay:450ms]">
                Shoot for the <em>stars,</em>
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="animate-reveal block [animation-delay:620ms]">
                land on the <em>moon.</em>
              </span>
            </span>
          </h1>
        </div>

        {/* Bottom rail */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="animate-fade [animation-delay:1100ms]">
            <p className="kicker text-paper/50">Shots taken</p>
            <p className="mt-1 flex items-baseline gap-3">
              <span className="display text-[clamp(4.5rem,9vw,8.5rem)] leading-[0.8] text-acid">
                {pad(total)}
              </span>
              <span className="font-serif text-2xl italic text-paper/60 sm:text-3xl">
                of a thousand
              </span>
            </p>
            <p className="kicker mt-3 text-paper/40">
              Every star is a shot · <span className="hidden sm:inline">hover</span>
              <span className="sm:hidden">tap</span> to find yours
            </p>
          </div>

          <div className="animate-fade hidden flex-col items-center gap-3 [animation-delay:1500ms] lg:flex">
            <span className="kicker text-paper/40">Scroll</span>
            <span className="scroll-line block h-12 w-px bg-paper/15" />
          </div>

          <button
            onClick={onNew}
            className="animate-fade group pointer-events-auto flex cursor-pointer items-center gap-4 rounded-full border border-paper/25 py-2.5 pl-2.5 pr-7 backdrop-blur-sm transition-colors duration-500 [animation-delay:1300ms] hover:border-paper hover:bg-paper hover:text-ink"
          >
            <span className="grid size-11 place-items-center rounded-full bg-acid text-2xl text-ink transition-transform duration-500 group-hover:rotate-90">
              +
            </span>
            <span className="font-serif text-2xl italic">Take a shot</span>
          </button>
        </div>
      </div>
    </section>
  );
}
