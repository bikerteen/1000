"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, AUTH_MAX_AGE, isAuthed, passToken } from "@/lib/auth";
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

function clean(input: ShotInput): Fields {
  const title = text(input.title, 280);
  if (!title) throw new Error("A shot needs a title.");
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

// Server actions are reachable by direct POST, so each one checks the cookie too.
async function requireAuth() {
  if (!(await isAuthed((await cookies()).get(AUTH_COOKIE)?.value))) {
    throw new Error("Locked. Enter the password first.");
  }
}

export async function saveShot(input: ShotInput): Promise<Shot[]> {
  await requireAuth();
  const fields = clean(input);
  if (input.id) await store.update(input.id, fields);
  else await store.create(fields);
  return store.list();
}

export async function deleteShot(id: string): Promise<Shot[]> {
  await requireAuth();
  await store.remove(id);
  return store.list();
}

/* ───────── The door ───────── */

export type UnlockState = { error?: string; attempt: number };

export async function unlock(prev: UnlockState, form: FormData): Promise<UnlockState> {
  const password = process.env.SITE_PASSWORD;
  if (!password) {
    return { error: "No password is set on the server.", attempt: prev.attempt + 1 };
  }
  // A beat of suspense, and a speed bump for guessers.
  await new Promise((r) => setTimeout(r, 600));
  const guess = String(form.get("password") ?? "").trim();
  if (guess.toLowerCase() !== password.toLowerCase()) {
    return { error: "Not quite. Try again.", attempt: prev.attempt + 1 };
  }
  (await cookies()).set(AUTH_COOKIE, await passToken(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_MAX_AGE,
  });
  redirect("/");
}

export async function lock() {
  (await cookies()).delete(AUTH_COOKIE);
  redirect("/unlock");
}
