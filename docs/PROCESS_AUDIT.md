# Competition process audit

Date: 2026-03-11

## Goal

Confirm BrewJudge supports the competition process without allowing the software to block real-world operations.

## Findings

### 1. Competition status flow was too rigid

Normal status transitions are still useful for day-to-day operations, but a live event needs an escape hatch.

Mitigation added:
- Admin emergency status override on the competition detail page.

Operational use cases:
- reopen entry intake briefly for a late correction
- move a stuck competition out of a bad state
- recover from accidental status changes during an event

### 2. Admin participation as entrants needed to be explicit

Admins can now create entries even when the competition is not in the normal `accepting_entries` state.

Mitigation added:
- admin entry override support in entrant creation flow
- explicit admin entry link from the admin competition detail page

Operational use cases:
- entering an organizer beer
- manually recording an entry that arrives during setup friction
- correcting an operational miss without database surgery

### 3. Self-judging needed stronger enforcement

The application already prevented assigning a judge to their own entry, but this should not rely only on UI/server-action logic.

Mitigation added:
- database trigger to block self-judging in judge assignments
- database trigger to block self-judging in scoresheets

Operational use cases:
- prevents accidental assignment in manual admin work
- prevents direct database/API misuse from creating invalid judging states

### 4. Manual assignment and recovery are available

The system already supports:
- manual judge assignment
- manual assignment removal
- optional auto-assignment instead of mandatory auto-assignment
- direct member creation and invitation from admin tools

This is good because it keeps the software from forcing a single deterministic path.

## Recommended operating policy

1. Use normal transitions first.
2. Use manual assignment before relying on automation if the competition is small or unusual.
3. Use the emergency status override only when needed to unblock operations.
4. If the system becomes unavailable during an event, continue on paper and re-enter the data later.

## Remaining low-risk recommendations

1. Add printable emergency score sheets for offline fallback.
2. Add entrant/admin CSV exports for entries and assignments.
3. Add an explicit audit log for admin overrides and assignment changes.

## Summary

BrewJudge now has practical escape hatches for the most likely operational bottlenecks:
- admin status override
- admin entry override
- manual judge assignment controls
- database-level self-judging protection

The process is now less likely to be held hostage by a single rigid software rule.