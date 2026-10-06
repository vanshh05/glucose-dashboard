# Glucose Monitor — Research Dashboard

React + Vite + TypeScript + Tailwind + Supabase + Recharts.
Reads the `glucose-monitor-dev` Supabase project (`inijbiocgxqhntpnakxu`).

## What's inside

- **Overview** — summary stats + recent sessions
- **Subjects** — list and per-subject detail with OGTT trend chart (confidence band + ground-truth dots)
- **Sessions** — searchable list, quality filter, per-session detail
- **Error Grid** — Clarke zone scatter with MARD and zone %
- **Data Quality** — rejections, Fitzpatrick coverage
- **Models** — registry with held-out metrics

Research-labelling banner is site-wide and non-negotiable.

## Run locally

```bash
# 1. Install
npm install

# 2. Env — grab the two values from Supabase → Project Settings → API
cp .env.example .env
# edit .env, paste the anon public key

# 3. Dev server
npm run dev
# → http://localhost:5173
```

## Deploy to Vercel

Two options:

### Option A — one-shot via Vercel CLI
```bash
npm i -g vercel
vercel          # answer prompts, pick framework "Vite"
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod
```

### Option B — GitHub + Vercel UI
1. Push this folder to a new GitHub repo.
2. On [vercel.com](https://vercel.com) → **Add New** → **Project** → import the repo.
3. Framework preset auto-detects as **Vite**.
4. Settings → **Environment Variables** add:
   - `VITE_SUPABASE_URL` = `https://inijbiocgxqhntpnakxu.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = *(from Supabase dashboard)*
5. Deploy.

`vercel.json` rewrites all paths to `/` so SPA deep links work.

## Later: React Native app

The data layer and most logic port directly:

- `src/lib/supabase.ts` and `src/lib/utils.ts` → copy as-is
- Pages → convert `<div>` → `<View>`, `<p>` → `<Text>`, Tailwind → `nativewind` or styles
- Recharts → `victory-native` or `react-native-svg-charts`
- Routing → `react-navigation`

The Supabase queries, types, Clarke math, and MARD computation are shared code.

## Security notes

- The **anon key** is browser-safe; row-level security on the DB restricts what it can read.
- The **service role key** stays server-side only. Never commit it; never put it in Vercel's "exposed" env vars.
- Before any public demo, replace the dev-time `dev_read_all_*` policies in the DB with real tenant-scoped ones.

## Project structure

```
src/
  lib/
    supabase.ts      — client + types
    utils.ts         — formatting + Clarke math
  components/
    Layout.tsx       — nav + research banner
    ui.tsx           — Card, Stat, Badge, loaders
  pages/
    OverviewPage.tsx
    SubjectsPage.tsx
    SubjectDetailPage.tsx
    SessionsPage.tsx
    SessionDetailPage.tsx
    ErrorGridPage.tsx
    DataQualityPage.tsx
    ModelsPage.tsx
  main.tsx           — router
  index.css          — Tailwind entry
```
