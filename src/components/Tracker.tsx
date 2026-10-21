"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { deleteShot, lock, saveShot } from "@/app/actions";
import {
  STATUSES,
  STATUS_META,
  type Data,
  type Shot,
  type ShotInput,
  type Status,
} from "@/lib/types";
import {
  STATUS_STYLE,
  addYears,
  daysBetween,
  fmtDate,
  pad,
} from "@/lib/format";
import Flash, { type FlashEvent } from "./Flash";
import Hero from "./Hero";
import ShotSheet from "./ShotSheet";
import StatusPicker from "./StatusPicker";
import Wall from "./Wall";

type Filter = Status | "all";

const MANTRAS = [
  "Shoot for the stars",
  "Every no is a receipt",
  "Ask anyway",
  "Land on the moon",
  "Rejection is data",
  "Send the email",
  "Be embarrassingly ambitious",
  "1000 or bust",
];

export default function Tracker({
  initial,
  today,
}: {
  initial: Data;
  today: string;
}) {
  const { meta } = initial;
  const [shots, setShots] = useState(initial.shots);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [newestFirst, setNewestFirst] = useState(true);
  const [editing, setEditing] = useState<Shot | "new" | null>(null);
  const [flash, setFlash] = useState<FlashEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const counts = useMemo(() => {
    const c = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
    for (const s of shots) c[s.status]++;
    return c;
  }, [shots]);

  const total = shots.length;
  const nextN = shots.reduce((m, s) => Math.max(m, s.n), 0) + 1;
  const resolved = total - counts.pending;
  const yesRate = resolved ? Math.round((counts.accepted / resolved) * 100) : 0;

  // The decade clock.
  const endsOn = addYears(meta.startedOn, meta.years);
  const totalDays = daysBetween(meta.startedOn, endsOn);
  const dayNo = Math.min(Math.max(daysBetween(meta.startedOn, today) + 1, 1), totalDays);
  const timePct = (dayNo / totalDays) * 100;
  const shotPct = Math.min((total / meta.goal) * 100, 100);
  const expected = Math.ceil((meta.goal * dayNo) / totalDays);
  const weeksLeft = Math.max((totalDays - dayNo) / 7, 1);
  const perWeek = Math.max(meta.goal - total, 0) / weeksLeft;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shots
      .filter((s) => filter === "all" || s.status === filter)
      .filter(
        (s) =>
          !q ||
          [s.title, s.target, s.notes].some((t) => t?.toLowerCase().includes(q)),
      )
      .sort((a, b) => (newestFirst ? b.n - a.n : a.n - b.n));
  }, [shots, filter, query, newestFirst]);

  const save = useCallback(
    (input: ShotInput, closeSheet = true) => {
      const before = input.id ? shots.find((s) => s.id === input.id) : undefined;
      setError(null);
      startTransition(async () => {
        try {
          const next = await saveShot(input);
          setShots(next);
          if (closeSheet) setEditing(null);
          if (!before) {
            setFlash({ kind: "new", n: Math.max(...next.map((s) => s.n)), key: Date.now() });
          } else if (input.status !== before.status && input.status !== "pending") {
            setFlash({
              kind: "status",
              status: input.status,
              count: next.filter((s) => s.status === input.status).length,
              key: Date.now(),
            });
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : "Couldn't save that one.");
        }
      });
    },
    [shots],
  );

  const quickStatus = (shot: Shot, status: Status) =>
    save(
      {
        ...shot,
        status,
        answeredOn: status === "pending" ? shot.answeredOn : shot.answeredOn ?? today,
      },
      false,
    );

  const remove = (id: string) =>
    startTransition(async () => {
      try {
        setShots(await deleteShot(id));
        setEditing(null);
      } catch {
        setError("Couldn't delete that one.");
      }
    });

  // Press N anywhere to take a new shot.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (editing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setEditing("new");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing]);

  const closeSheet = useCallback(() => setEditing(null), []);
  const endFlash = useCallback(() => setFlash(null), []);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ meta, shots }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `1000-rejections-${today}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const jumpToList = (f: Filter) => {
    setFilter(f);
    document.getElementById("list")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main>
      {/* ───────────── OPENING ───────────── */}
      <Hero
        shots={shots}
        goal={meta.goal}
        owner={meta.owner}
        today={today}
        endsOn={endsOn}
        onNew={() => setEditing("new")}
        onPick={(s) => setEditing(s)}
      />

      <div className="overflow-hidden border-y-2 border-ink bg-acid py-2.5 text-ink">
        <div className="animate-marquee flex w-max">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0" aria-hidden={k === 1}>
              {[...MANTRAS, ...MANTRAS].map((m, i) => (
                <span key={i} className="display flex items-center whitespace-nowrap text-3xl">
                  <span className="px-5">{m}</span>
                  <span className="text-signal">✶</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ───────────── THE SCORE ───────────── */}
      <section className="px-4 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 flex items-baseline justify-between gap-4 border-b-2 border-ink pb-3">
          <h2 className="display text-6xl sm:text-8xl">The Score</h2>
          <span className="kicker hidden text-right sm:inline">Tap a number to filter</span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {(["pending", "accepted", "rejected", "no_answer", "missed"] as const).map(
            (s, i) => (
              <button
                key={s}
                onClick={() => jumpToList(s)}
                className="group animate-rise cursor-pointer text-left"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className={`block h-2 ${STATUS_STYLE[s].bar} ${s === "accepted" ? "outline outline-1 outline-ink" : ""}`} />
                <span className="display mt-3 block text-7xl transition-transform group-hover:-translate-y-1 sm:text-9xl">
                  {pad(counts[s], 2)}
                </span>
                <span className="kicker mt-1 block">{STATUS_META[s].label}</span>
              </button>
            ),
          )}
          <div className="col-span-2 sm:col-span-1">
            <span className="block h-2 bg-ink" />
            <span className="display mt-3 block text-7xl sm:text-9xl">
              {yesRate}
              <span className="text-5xl">%</span>
            </span>
            <span className="kicker mt-1 block">Yes rate · of {resolved} answered</span>
          </div>
        </div>
      </section>

      {/* ───────────── THE WALL ───────────── */}
      <section className="bg-ink px-4 py-12 text-paper sm:px-8 sm:py-16">
        <div className="mb-8 grid gap-4 lg:grid-cols-12">
          <h2 className="display text-6xl sm:text-8xl lg:col-span-5">The Wall</h2>
          <div className="flex flex-col justify-end gap-4 lg:col-span-7">
            <p className="font-serif text-2xl italic text-paper/80 sm:text-3xl">
              Every square is a shot. Fill it before {fmtDate(endsOn)}.
            </p>
            <ul className="kicker flex flex-wrap gap-x-5 gap-y-2 text-paper/70">
              {STATUSES.map((s) => (
                <li key={s} className="flex items-center gap-2">
                  <span className={`inline-block size-3 ${STATUS_STYLE[s].cell}`} />
                  {STATUS_META[s].label}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Wall shots={shots} goal={meta.goal} onPick={(s) => setEditing(s)} />

        {/* The decade clock */}
        <div className="mt-14 grid gap-10 border-t border-paper/15 pt-10 lg:grid-cols-2">
          <div className="space-y-6">
            <Bar label={`Time · day ${dayNo.toLocaleString()} of ${totalDays.toLocaleString()}`} pct={timePct} className="bg-paper" />
            <Bar label={`Shots · ${total} of ${meta.goal}`} pct={shotPct} className="bg-acid" />
          </div>
          <div className="flex flex-col justify-center gap-2">
            <p className="display text-5xl sm:text-6xl">
              {total >= expected ? (
                <>
                  <span className="text-acid">Ahead</span> by {total - expected}
                </>
              ) : (
                <>
                  <span className="text-signal">Behind</span> by {expected - total}
                </>
              )}
            </p>
            <p className="font-serif text-2xl italic text-paper/75">
              {perWeek < 0.05
                ? "You did it. Now go for two thousand."
                : `${perWeek.toFixed(1)} shots a week gets you to ${meta.goal} by ${fmtDate(endsOn)}.`}
            </p>
          </div>
        </div>
      </section>

      {/* ───────────── THE LIST ───────────── */}
      <section id="list" className="scroll-mt-4 px-4 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-ink pb-3">
          <h2 className="display text-6xl sm:text-8xl">
            The List <sup className="kicker align-super text-sm">{visible.length}</sup>
          </h2>
          <button
            onClick={() => setEditing("new")}
            className="display cursor-pointer bg-ink px-4 py-2 text-2xl text-acid transition hover:bg-signal hover:text-ink"
          >
            + New shot
          </button>
        </div>

        <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center gap-2 border-b border-rule bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
          <div className="-mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:w-auto sm:flex-wrap sm:px-0">
            {(["all", ...STATUSES] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`kicker shrink-0 cursor-pointer whitespace-nowrap rounded-full border-2 px-3 py-1.5 transition ${filter === f ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink"}`}
              >
                {f === "all" ? "All" : STATUS_META[f].label}{" "}
                <span className="opacity-60">{f === "all" ? total : counts[f]}</span>
              </button>
            ))}
          </div>
          <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="kicker min-w-0 flex-1 border-b-2 border-ink/20 bg-transparent py-1.5 outline-none focus:border-ink sm:w-48"
            />
            <button
              onClick={() => setNewestFirst((v) => !v)}
              className="kicker cursor-pointer whitespace-nowrap px-2 py-1.5 hover:bg-acid"
            >
              {newestFirst ? "Newest ↓" : "Oldest ↑"}
            </button>
          </div>
        </div>

        <ol>
          {visible.map((s) => (
            <li
              key={s.id}
              onClick={() => setEditing(s)}
              className="group -mx-4 grid cursor-pointer grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 border-b border-rule px-4 py-5 transition-colors hover:bg-acid sm:-mx-8 sm:grid-cols-[5rem_1fr_10rem_9.5rem] sm:px-8 sm:py-6"
            >
              <span className="kicker col-start-1 row-start-1 text-fog group-hover:text-ink">
                №{pad(s.n)}
              </span>
              <div className="col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                <button className="display cursor-pointer text-left text-4xl sm:text-5xl">
                  {s.title}
                </button>
                {s.target && (
                  <p className="mt-1 font-serif text-xl italic text-ink/70">
                    {s.target}
                  </p>
                )}
              </div>
              <div className="kicker col-span-2 row-start-3 flex gap-3 text-fog group-hover:text-ink sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:flex-col sm:gap-1">
                <span>{s.category}</span>
                {s.askedOn ? (
                  <span>Asked {fmtDate(s.askedOn)}</span>
                ) : (
                  s.status === "pending" && <span className="text-signal">Not sent yet</span>
                )}
                {s.answeredOn && <span>Answer {fmtDate(s.answeredOn)}</span>}
              </div>
              <div className="col-start-2 row-start-1 justify-self-end sm:col-start-4">
                <StatusPicker value={s.status} onChange={(st) => quickStatus(s, st)} />
              </div>
            </li>
          ))}
        </ol>

        {visible.length === 0 && (
          <div className="py-20 text-center">
            <p className="display text-6xl">Nothing here.</p>
            <p className="mt-3 font-serif text-2xl italic">
              {total === 0 ? "Take your first shot." : "Clear the filter — or go get some more."}
            </p>
          </div>
        )}
      </section>

      {/* ───────────── FOOTER ───────────── */}
      <footer className="bg-ink px-4 pt-14 pb-8 text-paper sm:px-8">
        <p className="display text-[16vw] leading-[0.8] sm:text-[11vw]">
          Ask <span className="text-acid">anyway.</span>
        </p>
        <div className="kicker mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-paper/15 pt-4 text-paper/60">
          <span>
            {meta.owner} · Started {fmtDate(meta.startedOn)} · Ends {fmtDate(endsOn)}
          </span>
          <div className="flex gap-6">
            <button onClick={exportJson} className="cursor-pointer hover:text-acid">
              Export backup (.json) ↓
            </button>
            <form action={lock}>
              <button className="cursor-pointer hover:text-signal">Lock ●</button>
            </form>
          </div>
        </div>
      </footer>

      {editing && (
        <ShotSheet
          key={editing === "new" ? "new" : editing.id}
          shot={editing === "new" ? null : editing}
          nextN={nextN}
          today={today}
          busy={busy}
          onSave={save}
          onDelete={remove}
          onClose={closeSheet}
        />
      )}

      {flash && <Flash event={flash} onDone={endFlash} />}

      {error && (
        <div
          role="alert"
          className="kicker fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 bg-signal px-4 py-3 text-ink"
        >
          {error}{" "}
          <button className="ml-3 cursor-pointer underline" onClick={() => setError(null)}>
            OK
          </button>
        </div>
      )}
    </main>
  );
}

function Bar({ label, pct, className }: { label: string; pct: number; className: string }) {
  return (
    <div>
      <div className="kicker mb-2 flex justify-between text-paper/70">
        <span>{label}</span>
        <span>{pct < 1 ? pct.toFixed(2) : pct.toFixed(0)}%</span>
      </div>
      <div className="h-4 bg-paper/10">
        <div className={`h-full ${className}`} style={{ width: `${Math.max(pct, 0.4)}%` }} />
      </div>
    </div>
  );
}
