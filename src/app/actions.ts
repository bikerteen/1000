"use server";

import { cookies } from "next/headers";
import { DOOR_COOKIE, DOOR_TTL, doorToken, isSessionValid } from "@/lib/auth";
import { store, type Fields } from "@/lib/store";
import { CATEGORIES, STATUSES, type Shot, type ShotInput } from "@/lib/types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function text(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim().slice(0, max);
  return t || undefined;
}

function date(v: unknown): string | undefined {
  return typeof v === "string" && DATE.test(v) ? v : undefined;
}

function clean(input: ShotInput): Fields | null {
  const title = text(input.title, 280);
  if (!title) return null;
  return {
    title,
    target: text(input.target, 120),
    category: CATEGORIES.includes(input.category) ? input.category : "career",
    status: STATUSES.includes(input.status) ? input.status : "pending",
    askedOn: date(input.askedOn),
    answeredOn: date(input.answeredOn),
    link: text(input.link, 500),
    notes: text(input.notes, 4000),
  };
}

// Results, not throws: production hides thrown messages from the client.
export type Result = { ok: true; shots: Shot[] } | { ok: false; error: string; locked?: true };

const LOCKED: Result = { ok: false, error: "Locked. Enter the password again.", locked: true };

export async function saveShot(token: string, input: ShotInput): Promise<Result> {
  if (!(await isSessionValid(token))) return LOCKED;
  const fields = clean(input);
  if (!fields) return { ok: false, error: "A shot needs a title." };
  if (input.id) await store.update(input.id, fields);
  else await store.create(fields);
  return { ok: true, shots: await store.list() };
}

export async function deleteShot(token: string, id: string): Promise<Result> {
  if (!(await isSessionValid(token))) return LOCKED;
  await store.remove(id);
  return { ok: true, shots: await store.list() };
}

/* ───────── The door ───────── */

export type UnlockState = { error?: string; ok?: true; attempt: number };

export async function unlock(prev: UnlockState, form: FormData): Promise<UnlockState> {
  const password = process.env.SITE_PASSWORD;
  const token = await doorToken();
  if (!password || !token) {
    return { error: "No password is set on the server.", attempt: prev.attempt + 1 };
  }
  // A beat of suspense, and a speed bump for guessers.
  await new Promise((r) => setTimeout(r, 600));
  const guess = String(form.get("password") ?? "").trim();
  if (guess.toLowerCase() !== password.toLowerCase()) {
    return { error: "Not quite. Try again.", attempt: prev.attempt + 1 };
  }
  (await cookies()).set(DOOR_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DOOR_TTL,
  });
  // The client does a full page load to "/", which spends the door cookie.
  return { ok: true, attempt: prev.attempt + 1 };
}
