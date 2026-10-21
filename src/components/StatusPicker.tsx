"use client";

import { useEffect, useRef, useState } from "react";
import { STATUSES, type Status } from "@/lib/types";
import Stamp from "./Stamp";

/** Tap the stamp, pick the outcome. The fastest way to log a no. */
export default function StatusPicker({
  value,
  onChange,
}: {
  value: Status;
  onChange: (s: Status) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change outcome"
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        <Stamp status={value} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 flex w-48 flex-col gap-1 border-2 border-ink bg-paper p-2 shadow-[6px_6px_0_var(--color-ink)]"
        >
          <p className="kicker px-1 pb-1 text-fog">Outcome</p>
          {STATUSES.map((s) => (
            <button
              key={s}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                if (s !== value) onChange(s);
              }}
              className={`flex cursor-pointer items-center justify-start px-1 py-1.5 text-left hover:bg-acid ${s === value ? "bg-ink/5" : ""}`}
            >
              <Stamp status={s} size="sm" tilt={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
