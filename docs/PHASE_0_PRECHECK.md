# Phase 0 — Preflight Checklist

This file is the execution checklist for Phase 0 of BrewJudge.

## Phase 0 outcome
By the end of this phase, the project should be ready for application scaffolding in Phase 1.

## 1. Repository setup
- [x] Initialize a git repository
- [x] Create the remote GitHub repository
- [x] Connect local repo to GitHub
- [ ] Protect `main` as the deployable branch
- [x] Decide branch naming for feature work, use `phase/<n>-<slug>`

## 2. Runtime and tooling decisions
- [x] Confirm Node.js version target (`20.x` recommended for current Next.js + Vercel compatibility)
- [x] Confirm package manager (`npm` recommended for simplicity)
- [x] Confirm TypeScript strict mode will remain enabled
- [x] Confirm Vercel is the production deployment target

## 3. Supabase project setup
- [x] Create the Supabase project
- [x] Save project URL
- [x] Save anon key
- [x] Save service role key if admin/server-side privileged actions will be used
- [ ] Decide whether local Supabase CLI usage is required from the start

## 4. Environment variables
Required for Phase 1:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Likely needed soon after:
- `SUPABASE_SERVICE_ROLE_KEY`

Status:
- [x] `.env.local` populated
- [x] `.env.example` restored as a sanitized template

## 5. Authentication and test users
Prepare a small validation set:
- [ ] 1 admin account
- [ ] 2 judge accounts
- [ ] 2 entrant accounts
- [ ] Verify at least one account can sign in through Supabase Auth

## 6. External data dependency check
Original architecture note:
- `https://raw.githubusercontent.com/lrdodge/bjcp-style-data/master/json/style-data.json`

Final Phase 0 decision:
- Treat the local BJCP 2021 DOCX as the canonical source.
- Normalize the DOCX with Pandoc into Markdown.
- Extract seed-oriented structured data from the Pandoc Markdown.

Current local source chain:
- Canonical source: `docs/2021_Guidelines_Beer_1.25.docx`
- Pandoc output: `docs/BJCP_2021_GUIDELINES.md`
- Structured extraction preview: `docs/BJCP_2021_STYLES_EXTRACT.csv`
- Extraction review notes: `docs/BJCP_2021_EXTRACTION_SUMMARY.md`

Current extraction status:
- 102 styles discovered
- 84 styles parsed with numeric vital statistics
- 18 specialty styles flagged for manual review in Phase 1 seed work

## 7. Recommended repository structure

```text
/
├── app/
├── components/
├── lib/
├── supabase/
│   ├── migrations/
│   └── seeds/
├── scripts/
├── public/
├── docs/
└── prompts/
```

## 8. Risks to lock now
- `main` branch protection still needs to be configured in GitHub if desired.
- Invite flow may require service-role-backed server logic.
- Blind judging depends on strict query discipline, not just UI hiding.
- Competition state transitions must be enforced server-side from the first admin phase.
- 18 specialty BJCP styles still require manual validation during seed implementation.

## 9. Exit criteria
Phase 0 is complete when:
- [x] Local git repository exists
- [x] GitHub remote exists and is connected
- [x] Supabase project exists
- [x] Environment variables are documented and available
- [x] BJCP seed source decision is made
- [x] Team agrees to execute prompts in order
