"use client";

import { useEffect, useRef, useState } from "react";
import {
  CATEGORIES,
  STATUSES,
  STATUS_META,
  type Shot,
  type ShotInput,
} from "@/lib/types";
import { pad } from "@/lib/format";
import Stamp from "./Stamp";

const field =
  "w-full border-b-2 border-paper/25 bg-transparent py-2 text-lg text-paper placeholder:text-paper/30 outline-none transition-colors focus:border-acid";

export default function ShotSheet({
  shot,
  nextN,
  today,
  busy,
  onSave,
  onDelete,
  onClose,
}: {
  shot: Shot | null;
  nextN: number;
  today: string;
  busy: boolean;
  onSave: (input: ShotInput) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ShotInput>(() =>
    shot
      ? { ...shot }
      : { title: "", target: "", category: "career", status: "pending" },
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const set = <K extends keyof ShotInput>(k: K, v: ShotInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return titleRef.current?.focus();
    // Logging an outcome with no answer date? Stamp it today.
    const answeredOn =
      form.status !== "pending" && !form.answeredOn && shot?.status !== form.status
        ? today
        : form.answeredOn;
    onSave({ ...form, answeredOn });
  };

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/60 backdrop-blur-[2px]"
      />
      <form
        onSubmit={submit}
        className="animate-rise relative ml-auto flex h-full w-full max-w-xl flex-col overflow-y-auto bg-ink text-paper"
      >
        <div className="kicker flex items-center justify-between border-b border-paper/15 px-6 py-4">
          <span className="text-acid">
            {shot ? `Shot №${pad(shot.n)}` : `New shot · №${pad(nextN)}`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer hover:text-acid"
          >
            Close ✕
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-8 px-6 py-8">
          <label className="block">
            <span className="kicker text-paper/60">The dare</span>
            <textarea
              ref={titleRef}
              required
              rows={3}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Email EME Studios with a pitch…"
              className="display mt-2 w-full resize-none bg-transparent text-5xl text-paper outline-none placeholder:text-paper/20"
            />
          </label>

          <label className="block">
            <span className="kicker text-paper/60">Who are you asking</span>
            <input
              value={form.target ?? ""}
              onChange={(e) => set("target", e.target.value)}
              placeholder="Brand, person, institution"
              className={`${field} font-serif text-2xl italic`}
            />
          </label>

          <fieldset>
            <legend className="kicker mb-3 text-paper/60">Outcome</legend>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => {
                const on = form.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set("status", s)}
                    className={`cursor-pointer rounded-sm p-1.5 transition ${on ? "bg-paper" : "bg-paper/10 opacity-60 hover:opacity-100"}`}
                    title={STATUS_META[s].label}
                  >
                    <Stamp status={s} size="sm" tilt={false} />
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="kicker mb-3 text-paper/60">Category</legend>
            <div className="flex gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={form.category === c}
                  onClick={() => set("category", c)}
                  className={`kicker cursor-pointer rounded-full border-2 px-4 py-2 transition ${form.category === c ? "border-acid bg-acid text-ink" : "border-paper/25 hover:border-paper"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-6 [color-scheme:dark]">
            <label className="block">
              <span className="kicker text-paper/60">Asked on</span>
              <input
                type="date"
                value={form.askedOn ?? ""}
                onChange={(e) => set("askedOn", e.target.value)}
                className={field}
              />
              {!form.askedOn && (
                <button
                  type="button"
                  onClick={() => set("askedOn", today)}
                  className="kicker mt-2 cursor-pointer text-acid hover:underline"
                >
                  Sent it today →
                </button>
              )}
            </label>
            <label className="block">
              <span className="kicker text-paper/60">Answer on</span>
              <input
                type="date"
                value={form.answeredOn ?? ""}
                onChange={(e) => set("answeredOn", e.target.value)}
                className={field}
              />
            </label>
          </div>

          <label className="block">
            <span className="kicker text-paper/60">Link</span>
            <input
              type="url"
              value={form.link ?? ""}
              onChange={(e) => set("link", e.target.value)}
              placeholder="https://"
              className={field}
            />
          </label>

          <label className="block">
            <span className="kicker text-paper/60">Notes</span>
            <textarea
              rows={4}
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="The pitch, who you spoke to, what you'd do differently…"
              className={`${field} resize-y font-serif text-xl`}
            />
          </label>
        </div>

        <div className="sticky bottom-0 flex items-center gap-3 border-t border-paper/15 bg-ink px-6 py-4">
          <button
            type="submit"
            disabled={busy}
            className="display flex-1 cursor-pointer bg-acid px-6 py-4 text-3xl text-ink transition hover:bg-paper disabled:opacity-50"
          >
            {busy ? "Saving…" : shot ? "Save it" : "Take the shot"}
          </button>
          {shot && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                confirmDelete ? onDelete(shot.id) : setConfirmDelete(true)
              }
              onBlur={() => setConfirmDelete(false)}
              className={`kicker cursor-pointer px-3 py-4 transition ${confirmDelete ? "bg-signal text-ink" : "text-signal hover:bg-signal/15"}`}
            >
              {confirmDelete ? "Sure? Tap again" : "Delete"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
