import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import type { Shot } from "./types";

export type Fields = Omit<Shot, "id" | "n" | "createdAt" | "updatedAt">;

export interface Store {
  list(): Promise<Shot[]>;
  create(f: Fields): Promise<void>;
  update(id: string, f: Fields): Promise<void>;
  remove(id: string): Promise<void>;
}

/* ───────── Neon Postgres (production) ───────── */

function pgStore(url: string): Store {
  const sql = neon(url);
  let ready: Promise<unknown> | undefined;
  const init = () =>
    (ready ??= sql`
      create table if not exists shots (
        id          text primary key,
        n           integer not null unique,
        title       text not null,
        target      text,
        category    text not null default 'career',
        status      text not null default 'pending',
        asked_on    text,
        answered_on text,
        link        text,
        notes       text,
        created_at  timestamptz not null default now(),
        updated_at  timestamptz not null default now()
      )`.catch((e) => {
      ready = undefined; // retry on the next request
      throw e;
    }));

  const iso = (v: unknown) => new Date(v as string).toISOString();
  const opt = (v: unknown) => (v == null ? undefined : String(v));
  const toShot = (r: Record<string, unknown>): Shot => ({
    id: String(r.id),
    n: Number(r.n),
    title: String(r.title),
    target: opt(r.target),
    category: r.category as Shot["category"],
    status: r.status as Shot["status"],
    askedOn: opt(r.asked_on),
    answeredOn: opt(r.answered_on),
    link: opt(r.link),
    notes: opt(r.notes),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  });

  return {
    async list() {
      await init();
      const rows = await sql`select * from shots order by n`;
      return rows.map(toShot);
    },
    async create(f) {
      await init();
      await sql`
        insert into shots (id, n, title, target, category, status, asked_on, answered_on, link, notes)
        values (
          ${randomUUID()}, (select coalesce(max(n), 0) + 1 from shots),
          ${f.title}, ${f.target ?? null}, ${f.category}, ${f.status},
          ${f.askedOn ?? null}, ${f.answeredOn ?? null}, ${f.link ?? null}, ${f.notes ?? null}
        )`;
    },
    async update(id, f) {
      await init();
      await sql`
        update shots set
          title = ${f.title}, target = ${f.target ?? null}, category = ${f.category},
          status = ${f.status}, asked_on = ${f.askedOn ?? null},
          answered_on = ${f.answeredOn ?? null}, link = ${f.link ?? null},
          notes = ${f.notes ?? null}, updated_at = now()
        where id = ${id}`;
    },
    async remove(id) {
      await init();
      // Delete and close the gap so №s stay 1…N. Shifting via negatives keeps
      // unique(n) from colliding mid-update (Postgres checks it row by row).
      await sql.transaction([
        sql`with gone as (delete from shots where id = ${id} returning n)
            update shots set n = -n where n > (select n from gone)`,
        sql`update shots set n = -n - 1 where n < 0`,
      ]);
    },
  };
}

/* ───────── Local JSON file (no DATABASE_URL) ───────── */

function fileStore(): Store {
  const FILE = path.join(process.cwd(), "data", "shots.json");
  let queue: Promise<unknown> = Promise.resolve();

  const read = async (): Promise<Shot[]> => {
    try {
      return (JSON.parse(await fs.readFile(FILE, "utf8")) as { shots: Shot[] }).shots;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw e;
    }
  };

  // Serialised read-modify-write with an atomic rename.
  const mutate = (fn: (shots: Shot[]) => Shot[]) => {
    const run = queue.then(async () => {
      const next = fn(await read());
      await fs.mkdir(path.dirname(FILE), { recursive: true });
      const tmp = `${FILE}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify({ shots: next }, null, 2) + "\n", "utf8");
      await fs.rename(tmp, FILE);
    });
    queue = run.catch(() => undefined);
    return run;
  };

  return {
    list: async () => (await read()).sort((a, b) => a.n - b.n),
    create: (f) =>
      mutate((shots) => {
        const now = new Date().toISOString();
        const n = shots.reduce((m, s) => Math.max(m, s.n), 0) + 1;
        return [...shots, { id: randomUUID(), n, ...f, createdAt: now, updatedAt: now }];
      }),
    update: (id, f) =>
      mutate((shots) =>
        shots.map((s) =>
          s.id === id ? { ...s, ...f, updatedAt: new Date().toISOString() } : s,
        ),
      ),
    remove: (id) =>
      mutate((shots) => {
        const gone = shots.find((s) => s.id === id);
        if (!gone) return shots;
        // Close the gap so №s stay 1…N.
        return shots
          .filter((s) => s.id !== id)
          .map((s) => (s.n > gone.n ? { ...s, n: s.n - 1 } : s));
      }),
  };
}

export const store: Store = process.env.DATABASE_URL
  ? pgStore(process.env.DATABASE_URL)
  : fileStore();
