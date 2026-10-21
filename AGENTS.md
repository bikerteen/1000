<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 1000 Rejections — project notes

Razik Darji's ten-year "1000 Rejections" tracker: every dare/ask (career or personal) is a "shot".

- **Storage** (`src/lib/store.ts`): Neon Postgres table `shots` when `DATABASE_URL` is set (production), otherwise the local file `data/shots.json`. `data/` is gitignored — the GitHub repo is public, so personal entries must never be committed. `npm run db:seed` copies the local file into Neon (skips existing ids). To change entries by hand in production, use SQL against Neon.
- **Password gate**: `src/proxy.ts` redirects everything to `/unlock` unless the `k1000` cookie matches an HMAC of `SITE_PASSWORD` (`src/lib/auth.ts`); server actions re-check it. The password only lives in env vars (`.env.local`, Vercel) — never in code.
- Challenge config (owner, goal, start date, years) is `META` in `src/lib/meta.ts`.
- Statuses: `pending` (In Play), `accepted`, `rejected`, `no_answer`, `missed` (Missed Out). `askedOn` empty + `pending` = lined up but not sent yet.
- Design: editorial/DAZED-style with a luxe opening (night-sky canvas in `Sky.tsx`, moon, Instrument Serif). Tokens in `src/app/globals.css` (paper, ink, acid, signal, cobalt, fog); type = Archivo condensed (`display`), Instrument Serif italic, Space Mono (`kicker`). Keep it high-contrast and editorial, no rounded-card SaaS look.
- Dev gotcha: if `globals.css` edits don't show up, stop the dev server and delete `.next/` (Turbopack cache served stale CSS).
