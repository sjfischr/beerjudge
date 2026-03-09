# Prompt 04 — Digital Scoresheet

```text
Build Phase 4 of BrewJudge. This is the core judging experience. Assume prior phases are complete and verified.

Tasks:
1. Create `/competitions/[id]/judge`:
   - query only blind entry data
   - show assigned entries for current judge
   - show scoresheet status: not started, draft, submitted
2. Create `/competitions/[id]/judge/[entryId]` with a BJCP-style digital scoresheet including:
   - entry header
   - style and competition info
   - judge name
   - five scored sections
   - comment areas
   - descriptor checklist for the 17 BJCP off-flavor descriptors
   - summary assessments for stylistic accuracy, technical merit, and intangibles
   - sticky running total with scoring tier
   - collapsible scoring guide
   - save draft and final submit actions
   - read-only mode after submission
   - debounced autosave for drafts
3. Add validation rules for final submission:
   - all score fields required
   - all section comments required
   - summary assessments required
   - valid score ranges enforced
4. Use RLS-safe upsert behavior so judges only manage their own scoresheets.

Implementation requirements:
- Optimize for judge speed and legibility.
- Keep brewer identity hidden everywhere.
- Enforce submitted-state lock server-side.
- Use warm neutral styling with strong readability.

At the end, provide:
1. Files created/updated
2. Scoresheet data flow summary
3. Manual judging test checklist
4. What to verify before Phase 5
```
