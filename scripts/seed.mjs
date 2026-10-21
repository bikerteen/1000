// Copy local data/shots.json into Neon. Safe to re-run: existing ids are skipped.
//   npm run db:seed   (reads DATABASE_URL from .env.local)
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Run `vercel env pull .env.local` first.");
  process.exit(1);
}
const sql = neon(url);
const file = process.argv[2] ?? "data/shots.json";
const { shots } = JSON.parse(await readFile(file, "utf8"));

// Keep in sync with the table in src/lib/store.ts.
await sql`
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
  )`;

let added = 0;
for (const s of shots) {
  const rows = await sql`
    insert into shots (id, n, title, target, category, status, asked_on, answered_on, link, notes, created_at, updated_at)
    values (${s.id}, ${s.n}, ${s.title}, ${s.target ?? null}, ${s.category}, ${s.status},
            ${s.askedOn ?? null}, ${s.answeredOn ?? null}, ${s.link ?? null}, ${s.notes ?? null},
            ${s.createdAt}, ${s.updatedAt})
    on conflict do nothing
    returning id`;
  added += rows.length;
}
const [{ count }] = await sql`select count(*)::int as count from shots`;
console.log(`Seeded ${added} new shot(s). ${count} in the database.`);
