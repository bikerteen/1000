"use client";

import { useEffect } from "react";
import { STATUS_META, type Status } from "@/lib/types";
import { STATUS_STYLE, pad } from "@/lib/format";

export type FlashEvent =
  | { kind: "new"; n: number; key: number }
  | { kind: "status"; status: Exclude<Status, "pending">; count: number; key: number };

/** Full-screen moment when something happens. Every no deserves a stamp. */
export default function Flash({
  event,
  onDone,
}: {
  event: FlashEvent;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 1900);
    return () => clearTimeout(t);
  }, [event.key, onDone]);

  const isNew = event.kind === "new";
  const bg = isNew ? "bg-ink text-acid" : STATUS_STYLE[event.status].flash;
  const word = isNew ? "Taken." : STATUS_META[event.status].flash;
  const kicker = isNew
    ? `Shot №${pad(event.n)} of 1000`
    : event.status === "rejected"
      ? `Rejection №${pad(event.count)}`
      : `${STATUS_META[event.status].label} · ${pad(event.count)} so far`;
  const sub = isNew
    ? "It's on the list. Now go send it."
    : STATUS_META[event.status].sub;

  return (
    <button
      onClick={onDone}
      aria-live="assertive"
      className={`fixed inset-0 z-[60] flex cursor-pointer flex-col items-center justify-center gap-6 overflow-hidden px-4 text-center ${bg}`}
    >
      <span className="kicker animate-rise">{kicker}</span>
      <span
        key={event.key}
        className="display animate-stamp block text-[clamp(5rem,24vw,22rem)]"
      >
        {word}
      </span>
      <span className="animate-rise font-serif text-2xl italic [animation-delay:200ms] sm:text-4xl">
        {sub}
      </span>
    </button>
  );
}
