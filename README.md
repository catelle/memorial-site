# En mémoire de KOUANHOU Stéphanie Donald

Memorial website (React + Vite) with a small Express/MongoDB API for tributes, candles,
captioned photos, news, the Prix d'Excellence et de Leadership laureates, and a password-protected family space.

## Run locally

```bash
npm install
cp .env.example .env   # then fill in MONGODB_URI and ADMIN_PASSWORD
npm run dev
```

`npm run dev` serves the site **and** the API (`/api/...`) together. If settings are missing,
a yellow warning is printed in the terminal. `npm run server` runs the API alone on port 3001.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB connection string |
| `MONGODB_DB` | no | Database name (default `memorial_site`) |
| `ADMIN_PASSWORD` | yes | Password for the family space at `/famille` |
| `ADMIN_SECRET` | no | Separate secret used to sign family-space sessions |

## Deploy on Vercel

1. Import this repository in Vercel (framework preset: Vite — detected from `vercel.json`).
2. In *Settings → Environment Variables*, add `MONGODB_URI`, `MONGODB_DB` and `ADMIN_PASSWORD`.
3. In MongoDB Atlas, allow connections from Vercel (*Network Access* → `0.0.0.0/0`).
4. Deploy. `api/index.js` exposes `server.js` as a serverless function; `vercel.json` routes `/api/*` to it
   and every other path to the single-page app.

## Pages

`/` · `/parcours` · `/prix` · `/hommages` · `/contact` · `/famille` (family space, not linked in the menu)

## Build

```bash
npm run typecheck
npm run build
```
