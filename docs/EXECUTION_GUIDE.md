# Prompt Execution Guide

Use this guide while running BrewJudge phase prompts in order.

## Before each phase
1. Confirm the prior phase met its exit criteria.
2. Commit the current state before starting the next phase.
3. Carry forward any implementation drift or design decisions.
4. Keep server-side enforcement ahead of UI work.

## During each phase
1. Make the smallest complete set of changes needed.
2. Prefer additive schema changes.
3. Keep blind judging rules intact.
4. Document any changed assumptions immediately.

## After each phase
1. Run migrations.
2. Test the primary workflow for that phase.
3. Test role boundaries:
   - anonymous
   - entrant
   - judge
   - admin
4. Fix issues before moving to the next phase.
5. Commit using a phase-specific message.

## Suggested commit messages
- `phase-0-preflight`
- `phase-1-foundation`
- `phase-2-admin`
- `phase-3-entrant-flow`
- `phase-4-scoresheet`
- `phase-5-results-history`
- `phase-6-polish-deploy`

## Minimum verification gates

### After Phase 1
- auth works
- migrations apply cleanly
- RLS is enabled everywhere
- blind judging base queries are safe

### After Phase 2
- admin-only pages are protected
- competition creation works
- judge assignment excludes self-judging

### After Phase 3
- entrants can submit entries only during `accepting_entries`
- entry numbers remain unique per competition

### After Phase 4
- judges can save drafts
- judges can submit final scoresheets
- submitted scoresheets lock correctly

### After Phase 5
- results only show after `closed` or `archived`
- brewers can read detailed feedback for their own entries

### After Phase 6
- build passes
- responsive pass is acceptable
- deployment steps are documented
- security review is complete

## Current Phase 0 blockers to resolve
1. Create and connect the GitHub remote.
2. Create the Supabase project.
3. Populate `.env.local` from `.env.example`.
4. Decide the BJCP 2021 data source, since the originally referenced raw URL currently returns 404 and the visible repository JSON files appear to be 2008-only.
