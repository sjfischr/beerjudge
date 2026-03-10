# BrewJudge

BrewJudge is a club-scale web app for running **blind homebrew competitions** with a **digital BJCP-style scoresheet** workflow.

It is designed for GRiST-style competitions (small batches of entries, a handful of judges) and focuses on:

- **Blind judging** (no brewer identity shown in judge views)
- **Fast, legible scoring** on laptops and tablets
- **Draft + autosave** and **final submission lock**
- **Results + feedback** once a competition is closed
- **Admin tooling** for competition setup, assignments, and exports

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres, RLS)
- Vercel (deployment)

## Local Development

1. Install dependencies

```bash
npm ci
```

2. Create `.env.local`

```bash
cp .env.example .env.local
```

Set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server/admin actions only)
- `NEXT_PUBLIC_SITE_URL` (the canonical deployed URL)

3. Run the dev server

```bash
npm run dev
```

4. Production build

```bash
npm run build
npm start
```

## Supabase Setup

### 1) Create a Supabase project

Create a new project in Supabase and copy the project URL + keys into `.env.local`.

### 2) Apply migrations

Migrations live in `supabase/migrations/`.

Apply them with the Supabase CLI (recommended) or via SQL editor.

### 3) Seed BJCP styles

The app includes a seed script:

```bash
npm run seed:bjcp
```

This populates `public.bjcp_styles` (used for style selection and display).

## Data Model (high level)

- `members` — profile + admin flag
- `competitions` — lifecycle status (`setup` → `accepting_entries` → `judging` → `closed` → `archived`)
- `entries` — brewer entries (contains brewer_id; never exposed to judges)
- `judge_assignments` — which judge scores which entry
- `scoresheets` — BJCP-style scoring sections + descriptors + status (`draft`/`submitted`)

### Blind judging

The `blind_entries` view exposes only the fields judges should see, filtered by the current user’s assignments.

## Competition Lifecycle

1. **Setup** (admin): create competition, configure allowed styles + judges per entry.
2. **Accepting entries** (admin): members submit entries.
3. **Judging** (admin): create judge assignments, judges fill out digital scoresheets.
4. **Closed** (admin): results visible to members; feedback visible for each member’s own entries.
5. **Archived** (admin): fully read-only historical record.

## Admin Guide

- Create competitions in `/admin`.
- Assign judges to entries (Phase 3 admin functionality).
- Review scores in `/admin/competitions/[id]/scores`.
- Export scoresheets as CSV (one row per scoresheet).

## Results

Results aggregation is provided by the database view:

- `public.competition_results`

This view:

- includes **only submitted scoresheets** in averages
- shows **pending** when no submitted sheets exist for an entry

## Print

Completed scoresheets are designed to be printable.

- Use the browser print dialog on a submitted scoresheet page.
- A basic print stylesheet lives in `app/globals.css` under `@media print`.

## Deployment (Vercel)

Primary flow: push to GitHub → Vercel auto-deploys.

### Environment variables

In Vercel Project Settings, set the same variables as `.env.local`.

Important:

- `NEXT_PUBLIC_SITE_URL` should be your canonical URL so Supabase auth links return to the deployed app.

### DNS for `comp.gristbrewing.com`

Typical Vercel setup:

- Add `comp.gristbrewing.com` as a domain in Vercel.
- Create the required DNS records in your DNS provider.
  - Usually a `CNAME` to Vercel (or `A` record depending on apex/subdomain).

Follow Vercel’s domain instructions for the exact records.

## Security Review Checklist (high level)

- RLS enabled on all tables.
- Judges can only see:
  - their own `judge_assignments`
  - their own `scoresheets`
  - `blind_entries` (filtered by assignments)
- Brewers can only see their own `entries`.
- `scoresheets` are **server-locked after submission**.
- Results routes are gated by competition status (`closed`/`archived`) server-side.

## Future Enhancements

- Tie-breaking rules and medal assignment
- Flight/table management
- Judge calibration and consensus notes
- Public results page (optional)
