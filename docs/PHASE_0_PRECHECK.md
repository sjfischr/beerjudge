# Phase 0 — Preflight Checklist

This file is the execution checklist for Phase 0 of BrewJudge.

## Phase 0 outcome
By the end of this phase, the project should be ready for application scaffolding in Phase 1.

## 1. Repository setup
- [x] Initialize a git repository
- [ ] Create the remote GitHub repository
- [ ] Connect local repo to GitHub
- [ ] Protect `main` as the deployable branch
- [ ] Decide branch naming for feature work, for example `phase/1-foundation`

## 2. Runtime and tooling decisions
- [ ] Confirm Node.js version target (`20.x` recommended for current Next.js + Vercel compatibility)
- [ ] Confirm package manager (`npm` recommended for simplicity)
- [ ] Confirm TypeScript strict mode will remain enabled
- [ ] Confirm Vercel is the production deployment target

## 3. Supabase project setup
- [ ] Create the Supabase project
- [ ] Save project URL
- [ ] Save anon key
- [ ] Save service role key if admin/server-side privileged actions will be used
- [ ] Decide whether local Supabase CLI usage is required from the start

## 4. Environment variables
Required for Phase 1:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Likely needed soon after:
- `SUPABASE_SERVICE_ROLE_KEY`

## 5. Authentication and test users
Prepare a small validation set:
- [ ] 1 admin account
- [ ] 2 judge accounts
- [ ] 2 entrant accounts
- [ ] Verify at least one account can sign in through Supabase Auth

## 6. External data dependency check
The architecture brief references:
- `https://raw.githubusercontent.com/lrdodge/bjcp-style-data/master/json/style-data.json`

Current findings:
- The repository is reachable.
- The default branch shown is `master`.
- The `json/` folder appears to contain `style-data-2008.json`, not a 2021 `style-data.json` file.
- The referenced raw URL currently returns 404.

### Decision required before Phase 1 seed work
Choose one of these before building the seed script:
1. Replace the source with a verified 2021 BJCP JSON source.
2. Vendor a local curated 2021 JSON file into the repo.
3. Adjust the seed scope to the available dataset and revisit 2021 coverage later.

Recommendation: vendor or identify a verified 2021 source before Phase 1 begins, so the seed script is deterministic.

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
- BJCP 2021 data source is not yet verified.
- Invite flow may require service-role-backed server logic.
- Blind judging depends on strict query discipline, not just UI hiding.
- Competition state transitions must be enforced server-side from the first admin phase.

## 9. Exit criteria
Phase 0 is complete when:
- [x] Local git repository exists
- [ ] GitHub remote exists and is connected
- [ ] Supabase project exists
- [ ] Environment variables are documented and available
- [ ] BJCP seed source decision is made
- [ ] Team agrees to execute prompts in order
