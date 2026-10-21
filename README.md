# 1000 Rejections

A ten-year dare: shoot for the stars a thousand times. Every no is a receipt.

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in SITE_PASSWORD (and DATABASE_URL for Neon)
npm run dev
```

Press **N** anywhere to take a new shot. Tap any stamp to log an outcome. Hover the stars to find your shots.

## How it works

- **Private by default.** Every page sits behind a password (`SITE_PASSWORD`). Share it with whoever you want in.
- **Storage.** With `DATABASE_URL` set, shots live in Neon Postgres. Without it, they're saved to `data/shots.json` locally (gitignored).
- **Moving local shots into Neon:** `vercel env pull .env.local`, then `npm run db:seed`.
