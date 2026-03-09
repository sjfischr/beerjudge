# Prompt 03 — Entrant Experience

```text
Build Phase 3 of BrewJudge, assuming Phases 1 and 2 are complete and working.

Tasks:
1. Create `/dashboard` with:
   - current active competition
   - my entries
   - my judging assignments
   - past competitions link
2. Create `/competitions/[id]/enter`:
   - available only when status = `accepting_entries`
   - two-tier BJCP style selector limited to competition `allowed_styles`
   - optional special ingredients field
   - style reference details from `bjcp_styles`
   - confirmation message including assigned entry number
3. Create `/competitions/[id]` showing:
   - public competition details
   - submit entry CTA when allowed
   - current user's entries for that competition
   - results link when status is `closed` or `archived`
4. Implement concurrency-safe per-competition `entry_number` assignment.

Implementation requirements:
- Enforce server-side status gates.
- Validate inputs client-side and server-side.
- Entrants may only create entries for themselves.
- Keep forms minimal and clean.

At the end, provide:
1. Files created/updated
2. Entry numbering approach
3. Manual entrant test checklist
4. What to verify before Phase 4
```
