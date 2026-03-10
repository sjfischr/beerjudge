# Prompt 01 — Foundation

```text
Build Phase 1 of BrewJudge.

Project summary:
BrewJudge is a lightweight self-hosted web app for GRiST homebrew club competitions. It uses digital BJCP-style scoresheets, supports blind judging, stores historical data, and resets cleanly between competitions.

Stack:
- Next.js 14+ with App Router, TypeScript, Tailwind CSS
- Supabase for database, authentication, and row-level security
- Deploy target: Vercel

Tasks:
1. Scaffold the Next.js project with TypeScript, Tailwind, `@supabase/supabase-js`, and `@supabase/ssr`.
2. Create Supabase migration SQL for:
   - `members`
   - `competitions`
   - `entries`
   - `judge_assignments`
   - `scoresheets`
   - `bjcp_styles`
3. Enable RLS on all tables with deny-by-default and add policies for:
   - admin full access
   - brewers seeing their own entries
   - judges seeing assigned entries only
   - judges managing only their own scoresheets
   - brewers seeing scoresheets for their entries only when competition status is `closed` or `archived`
4. Implement a `blind_entries` view that omits `brewer_id` for judge-facing queries.
5. Set up Supabase auth with email/password login.
6. Create middleware that protects all routes except the landing page and login page.
7. Create Supabase utilities for browser and server usage.
8. Create a BJCP seed script using the Phase 0 local BJCP 2021 source workflow:
   - canonical source: `docs/2021_Guidelines_Beer_1.25.docx`
   - normalized markdown: `docs/BJCP_2021_GUIDELINES.md`
   - extracted seed preview: `docs/BJCP_2021_STYLES_EXTRACT.csv`
   - review list: `docs/BJCP_2021_EXTRACTION_SUMMARY.md`
   Use the extracted CSV as the baseline and handle the flagged specialty styles intentionally rather than silently dropping them.
9. Build a basic layout with top nav, current user, logout, and a landing page showing the current active competition or a no-active-competition message.

Requirements:
- Do not create placeholder or stub files.
- Use environment variables for Supabase config.
- Keep code functional and production-oriented.
- Add any required helper functions, triggers, and timestamp handling needed for a clean foundation.

At the end, provide:
1. Files created/updated
2. Migration summary
3. Any environment variables required
4. What to verify before Phase 2
```
