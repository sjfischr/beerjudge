# Prompt 02 — Admin Operations

```text
Build Phase 2 of BrewJudge, assuming Phase 1 is complete and working.

Tasks:
1. Protect all `/admin/*` routes by verifying `members.is_admin = true` server-side.
2. Create `/admin/members` with:
   - member list
   - admin toggle
   - simple invite/create-user flow suitable for a small club
3. Create `/admin/competitions/new` with:
   - name
   - description
   - judges_per_entry
   - entry_deadline
   - judging_date
   - BJCP style selector grouped by category with category-level and subcategory-level selection
4. Create `/admin/competitions/[id]` with:
   - competition details
   - status display
   - allowed status transitions with confirmations
   - entry list showing entry number, style, brewer name, assigned judges
   - judge assignment UI
   - auto-assign option that excludes self-judging and balances workload
5. Create `/admin/competitions/[id]/scores` with:
   - per-entry judge totals
   - average score
   - scoresheet status
   - expandable detail view

Implementation requirements:
- Use server actions or API routes for mutations.
- Preserve blind judging for non-admin users.
- Add loading states and error handling.
- Validate status transitions server-side.

At the end, provide:
1. Files created/updated
2. New database logic, if any
3. Manual test checklist for admins
4. What to verify before Phase 3
```
