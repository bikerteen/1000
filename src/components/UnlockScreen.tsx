"use client";

import { useActionState } from "react";
import { unlock, type UnlockState } from "@/app/actions";
import Sky from "./Sky";

const noop = () => {};

/** The door. Same sky, no shots shown — those are for invited eyes. */
export default function UnlockScreen() {
  const [state, action, pending] = useActionState<UnlockState, FormData>(unlock, {
    attempt: 0,
  });

  return (
    <main className="relative isolate h-svh min-h-[600px] overflow-hidden bg-ink text-paper">
      <Sky shots={[]} goal={1000} onPick={noop} />

      <div aria-hidden className="moon-door pointer-events-none absolute">
        <div className="moon animate-moonrise size-full rounded-full" />
      </div>

      <div className="pointer-events-none relative flex h-full flex-col justify-between px-5 py-5 sm:px-10 sm:py-8">
        <div className="animate-fade flex items-baseline justify-between gap-4 [animation-delay:200ms]">
          <span className="font-serif text-xl italic sm:text-2xl">The 1000 Rejections Project</span>
          <span className="kicker hidden text-paper/50 sm:inline">Private · By invitation</span>
        </div>

        <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
          <p className="kicker overflow-hidden text-paper/50">
            <span className="animate-reveal block [animation-delay:300ms]">Members only</span>
          </p>
          <h1 className="mt-5 font-serif text-[17vw] leading-[0.9] tracking-[-0.02em] sm:text-[8vw]">
            <span className="block overflow-hidden pb-[0.08em]">
              <span className="animate-reveal block [animation-delay:450ms]">
                Say the <em>word.</em>
              </span>
            </span>
          </h1>

          <form
            key={state.attempt}
            action={action}
            className={`animate-fade pointer-events-auto mt-10 flex w-full max-w-sm items-center gap-3 border-b border-paper/30 pb-2 transition-colors [animation-delay:900ms] focus-within:border-paper ${state.error ? "animate-shake border-signal" : ""}`}
          >
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              autoCapitalize="none"
              spellCheck={false}
              disabled={pending}
              placeholder="password"
              className="min-w-0 flex-1 bg-transparent py-2 text-center font-serif text-3xl italic tracking-[0.12em] text-paper outline-none placeholder:text-paper/25 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={pending}
              aria-label="Enter"
              className="group grid size-12 shrink-0 cursor-pointer place-items-center rounded-full bg-acid text-xl text-ink transition-transform duration-500 hover:scale-110 disabled:animate-pulse"
            >
              <span className="transition-transform duration-500 group-hover:translate-x-0.5">
                {pending ? "·" : "→"}
              </span>
            </button>
          </form>

          <p
            role="status"
            className={`kicker mt-4 h-4 ${state.error ? "text-signal" : "text-paper/40"}`}
          >
            {state.error ?? (pending ? "Checking…" : "Shoot for the stars")}
          </p>
        </div>

        <div className="animate-fade flex items-baseline justify-between gap-4 mix-blend-difference [animation-delay:1200ms]">
          <span className="kicker text-paper/70">1000 shots · 10 years</span>
          <span className="kicker text-paper/70">Razik Darji — London</span>
        </div>
      </div>
    </main>
  );
}
