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
5. Commit using a phase-specific message and push to GitHub so Vercel deploys the updated application.

## BJCP 2021 source workflow
Use the local BJCP 2021 source files prepared in Phase 0.

Canonical inputs and derived artifacts:
- `docs/2021_Guidelines_Beer_1.25.docx`
- `docs/BJCP_2021_GUIDELINES.md`
- `docs/BJCP_2021_STYLES_EXTRACT.csv`
- `docs/BJCP_2021_EXTRACTION_SUMMARY.md`

Recommended regeneration flow:
1. Convert the DOCX to Markdown with Pandoc.
2. Run the extraction script to rebuild the CSV preview and review summary.
3. During Phase 1, use the CSV as the starting point for the `bjcp_styles` seed and manually resolve the flagged specialty styles.

Windows commands used in this repo:
- `& "$env:LOCALAPPDATA\Pandoc\pandoc.exe" ".\docs\2021_Guidelines_Beer_1.25.docx" -t gfm -o ".\docs\BJCP_2021_GUIDELINES.md"`
- `& ".\scripts\parse-bjcp-2021.ps1"`

Notes:
- If `pandoc` is not on `PATH`, reopen the terminal or call the executable from `$env:LOCALAPPDATA\Pandoc\pandoc.exe`.
- The extracted CSV currently covers the standard numeric vital statistics cases and leaves specialty edge cases for manual review.

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

## Phase 0 status
Phase 0 is complete enough to begin Phase 1.

Remaining optional follow-up items:
1. Configure `main` branch protection in GitHub.
2. Decide whether Supabase CLI should be part of the default local workflow.
3. Review the specialty styles listed in `docs/BJCP_2021_EXTRACTION_SUMMARY.md` during Phase 1 seeding.
