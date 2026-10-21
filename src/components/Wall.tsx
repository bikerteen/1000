"use client";

import { STATUS_META, type Shot } from "@/lib/types";
import { STATUS_STYLE, pad } from "@/lib/format";

/** 1000 squares. One per shot. Ten years to fill it. */
export default function Wall({
  shots,
  goal,
  onPick,
}: {
  shots: Shot[];
  goal: number;
  onPick: (s: Shot) => void;
}) {
  const ordered = [...shots].sort((a, b) => a.n - b.n);
  return (
    <div>
      <div
        className="grid grid-cols-[repeat(25,minmax(0,1fr))] gap-[3px] sm:grid-cols-[repeat(50,minmax(0,1fr))]"
        role="img"
        aria-label={`${shots.length} of ${goal} shots taken`}
      >
        {Array.from({ length: goal }, (_, i) => {
          const s = ordered[i];
          if (s) {
            return (
              <button
                key={s.id}
                type="button"
                tabIndex={-1}
                onClick={() => onPick(s)}
                title={`№${pad(s.n)} — ${s.title} — ${STATUS_META[s.status].label}`}
                className={`aspect-square cursor-pointer transition-transform hover:z-10 hover:scale-[2.2] ${STATUS_STYLE[s.status].cell}`}
              />
            );
          }
          if (i === ordered.length) {
            return (
              <span
                key="next"
                title="Your next shot"
                className="aspect-square animate-pulse border border-acid"
              />
            );
          }
          return (
            <span
              key={i}
              className={`aspect-square ${(i + 1) % 100 === 0 ? "bg-paper/25" : "bg-paper/[0.07]"}`}
            />
          );
        })}
      </div>
      <div className="kicker mt-3 flex justify-between text-paper/50">
        <span>001</span>
        <span>500</span>
        <span>{goal}</span>
      </div>
    </div>
  );
}
