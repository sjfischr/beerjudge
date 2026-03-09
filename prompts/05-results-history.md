# Prompt 05 — Results and History

```text
Build Phase 5 of BrewJudge, assuming the judging workflow is complete.

Tasks:
1. Create `/competitions/[id]/results` available only when status is `closed` or `archived`.
2. Support two results views:
   - overall ranked results for authenticated members
   - detailed feedback view for the current user's own entries
3. Create score aggregation logic as a database view or function named `competition_results`.
4. Create `/history` and `/history/[id]` for archived competitions.
5. Update the landing page with a quick summary of the most recent closed or archived competition.
6. Add admin CSV export on the admin scores page with one row per scoresheet.

Implementation requirements:
- Ignore unsubmitted scoresheets in averages.
- Show pending when no submitted sheets exist.
- Reuse the read-only scoresheet presentation for brewer feedback.
- Keep archived competitions fully read-only.

At the end, provide:
1. Files created/updated
2. Aggregation logic summary
3. Manual results/history test checklist
4. What to verify before Phase 6
```
