# BrewJudge — Phased Implementation Workplan

This document converts the source architecture brief into an execution-ready plan.
It is optimized for sequential prompt-driven implementation.

## Delivery Strategy

Build in strict order. Do not begin the next phase until the current phase meets its exit criteria.

### Execution rules
- Use one git commit per phase.
- Validate build, auth, database migrations, and critical flows at the end of each phase.
- Keep schema changes additive when possible.
- Prefer server-side enforcement over UI-only checks.
- Re-test blind judging rules after any schema or query changes.
- Keep a short changelog for every phase: what changed, what was verified, what remains.

---

## Phase 0 — Preflight / Environment Setup

### Goal
Prepare the repo, hosting, Supabase project, and environment variables before app work begins.

### Tasks
1. Create the Next.js repository and connect it to GitHub.
2. Create a Supabase project for BrewJudge.
3. Capture required environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` if server-side admin tasks or seeds require it
4. Decide package manager (`npm` is simplest unless another is preferred).
5. Confirm deployment target is Vercel.
6. Define branch workflow:
   - `main` = deployable
   - feature branches per phase
7. Prepare a small seed/test user set:
   - 1 admin
   - 2 judges
   - 2 entrants
8. Confirm the BJCP style data source is reachable.

### Deliverables
- Empty repo initialized
- Supabase project created
- Environment variables documented
- Initial deployment target decided

### Exit criteria
- App can be scaffolded immediately.
- Supabase credentials are available.
- Team knows the execution order below.

---

## Phase 1 — Foundation: App Scaffold, Schema, Auth, Base Layout

### Goal
Establish the full technical foundation: app scaffold, Supabase schema, RLS, auth, seed script, and base UI shell.

### Scope
- Next.js 14+ App Router with TypeScript and Tailwind
- Supabase browser/server utilities
- Auth middleware
- Initial SQL migration
- RLS setup for blind judging foundation
- BJCP seed script
- Basic layout and landing page

### Key implementation notes
- Enable RLS on every table immediately.
- Use a `blind_entries` view for judge-facing queries.
- Add timestamps and `updated_at` triggers consistently.
- Make entry numbering atomic from the beginning if possible.
- Keep the landing page functional, not placeholder-only.

### Deliverables
- Running app shell
- Working login flow
- Functional middleware protection
- Initial migration and policies
- BJCP style seed script
- Basic nav and landing page

### Exit criteria
- User can sign in.
- App builds successfully.
- Migrations apply cleanly.
- BJCP seed works.
- Judges cannot access brewer identity through intended app queries.

---

## Phase 2 — Admin Operations

### Goal
Give admins full control over members, competitions, assignments, and score oversight.

### Scope
- Admin route protection
- Member management
- Invite flow
- Competition creation
- Style selection UI
- Competition management
- Judge assignment UI
- Auto-assignment logic
- Admin score overview

### Key implementation notes
- Admin authorization must be enforced server-side.
- Auto-assignment must exclude self-judging.
- Status transitions should be validated against allowed next states.
- Entry visibility during judging must preserve blind judging for non-admins.

### Deliverables
- `/admin/page`
- `/admin/members`
- `/admin/competitions/new`
- `/admin/competitions/[id]`
- `/admin/competitions/[id]/scores`

### Exit criteria
- Admin can create a competition.
- Admin can manage members.
- Admin can assign judges manually and automatically.
- Admin can advance competition state safely.

---

## Phase 3 — Entrant Experience

### Goal
Implement the member dashboard, competition browsing, and entry submission workflow.

### Scope
- Member dashboard
- Entry submission page
- Competition detail page
- Entry number assignment logic
- Validation and status gating

### Key implementation notes
- Entry submission must be blocked unless competition is accepting entries.
- Allowed styles must come only from competition configuration.
- Entry number generation must be concurrency-safe.
- Entrants should only create entries for themselves.

### Deliverables
- `/dashboard`
- `/competitions/[id]`
- `/competitions/[id]/enter`
- Reliable entry numbering logic

### Exit criteria
- Entrant can submit an entry successfully.
- Entry number is unique and sequential per competition.
- Dashboard shows entries and assignments correctly.

---

## Phase 4 — Digital Scoresheet

### Goal
Deliver the core product value: a professional BJCP-style digital judging workflow.

### Scope
- Judge assignment list page
- Blind entry list from `blind_entries`
- Full scoresheet UI
- Draft save and final submit
- Read-only submitted state
- Validation rules
- Descriptor selection
- Running total and scoring tier
- Auto-save behavior

### Key implementation notes
- This phase is the product centerpiece.
- Optimize for desktop first, with acceptable mobile behavior.
- Use one-row scoresheet upsert logic.
- Enforce final submission server-side.
- Do not expose brewer identity in any query, payload, or component path.

### Deliverables
- `/competitions/[id]/judge`
- `/competitions/[id]/judge/[entryId]`
- Draft/save/submit workflow
- Read-only submitted scoresheets

### Exit criteria
- Judges can complete scoresheets end-to-end.
- Submitted scoresheets cannot be edited by judges.
- Running total and tier update correctly.
- Autosave works for drafts.

---

## Phase 5 — Results, Aggregation, History

### Goal
Expose readable results to members and detailed feedback to brewers after judging closes.

### Scope
- Competition results page
- Brewer-specific detailed results
- Aggregation view/function
- History index and detail pages
- Archive behavior
- Landing page results summary
- Admin CSV export

### Key implementation notes
- Do not reveal results before `closed` or `archived`.
- Average score logic should ignore unsubmitted sheets.
- Show pending status when no submitted scoresheets exist.
- Reuse the read-only scoresheet layout for brewer feedback.

### Deliverables
- `/competitions/[id]/results`
- `/history`
- `/history/[id]`
- Aggregation function/view
- CSV export on admin scores page

### Exit criteria
- Closed competitions show ranked results.
- Brewers can read detailed feedback for their own entries.
- Archived competitions are read-only and searchable.

---

## Phase 6 — Polish, Responsive, Deployment, Security Review

### Goal
Prepare the app for real club use and production deployment.

### Scope
- Responsive pass
- Visual polish
- Toasts and loading states
- Print stylesheet
- Vercel config
- README
- DNS instructions
- Security verification

### Key implementation notes
- Keep desktop as the best experience.
- Mobile must remain usable, especially for reference and review.
- Verify RLS and status gates with real test users.
- Confirm no route or API leaks brewer identity during judging.

### Deliverables
- Responsive UI refinements
- README
- Deployment docs
- Print styling
- Security checklist

### Exit criteria
- `next build` succeeds.
- Core flows are manually validated on desktop and mobile widths.
- Deployment steps are documented.
- Blind judging and final submission protections are verified.

---

## Cross-Phase Test Plan

Run these checks at the end of each relevant phase.

### Auth and role checks
- Anonymous user cannot access protected routes.
- Authenticated non-admin cannot access `/admin/*`.
- Admin can access all admin views.

### Blind judging checks
- Assigned judge can see entry number and style.
- Assigned judge cannot see brewer identity.
- Brewer can see own entry during competition.
- Brewer cannot see scoresheets until `closed` or `archived`.

### Scoresheet integrity checks
- Draft scoresheet saves.
- Submitted scoresheet locks.
- Non-assigned judge cannot access another scoresheet.

### Competition lifecycle checks
- Invalid status transitions are blocked.
- Entry submission closes once competition moves to `judging`.
- Results only appear after `closed`.
- Archived competitions are read-only.

---

## Recommended Execution Order

1. Phase 0 — Preflight
2. Phase 1 — Foundation
3. Phase 2 — Admin Operations
4. Phase 3 — Entrant Experience
5. Phase 4 — Digital Scoresheet
6. Phase 5 — Results and History
7. Phase 6 — Polish and Deployment

---

## Prompt Pack

Use these prompts in order. Each prompt assumes the previous phase is complete and verified.

### Prompt 0 — Preflight Planning

```text
We are starting the BrewJudge project. Before writing application code, create a concise implementation checklist for repository setup, Supabase project creation, required environment variables, local development prerequisites, and deployment assumptions. Use the following stack and product goals:

- Next.js 14+ App Router
- TypeScript
- Tailwind CSS
- Supabase for PostgreSQL, auth, and RLS
- Vercel deployment target
- Small private homebrew club competition workflow with blind judging

Output:
1. Preflight checklist
2. Risks/decisions that must be locked before coding
3. Recommended repo structure
4. Order of implementation phases

Do not generate placeholder app code in this step.
```

### Prompt 1 — Foundation

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
8. Create a BJCP seed script using:
   `https://raw.githubusercontent.com/lrdodge/bjcp-style-data/master/json/style-data.json`
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

### Prompt 2 — Admin Operations

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

### Prompt 3 — Entrant Experience

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

### Prompt 4 — Digital Scoresheet

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

### Prompt 5 — Results and History

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

### Prompt 6 — Polish, Deployment, Security Review

```text
Build Phase 6 of BrewJudge, assuming all prior phases are complete.

Tasks:
1. Perform a responsive pass for phone and tablet widths while preserving desktop as the primary experience.
2. Add UI polish:
   - warm neutral amber/stone palette
   - subtle transitions
   - empty states
   - loading skeletons
   - toast notifications
   - friendly error boundaries
3. Add a print stylesheet for completed scoresheets.
4. Add Vercel deployment configuration if needed.
5. Write a complete README covering:
   - project overview
   - tech stack
   - local development
   - environment variables
   - Supabase setup
   - migrations and BJCP seed
   - deployment
   - DNS setup for `comp.gristbrewing.com`
   - competition lifecycle
   - admin guide
6. Perform a security review of:
   - RLS behavior
   - blind judging protection
   - submission lock enforcement
   - status gate enforcement on the server

Implementation requirements:
- Ensure `next build` succeeds.
- Do not rely on client-only protections for sensitive behavior.
- Keep the scoresheet printable and readable.

At the end, provide:
1. Files created/updated
2. Security review findings
3. Deployment checklist
4. Remaining risks or future enhancements
```

---

## Prompt Execution Guidance

Before sending each prompt:
1. Commit the previous phase.
2. Verify the previous phase exit criteria.
3. Include any implementation drift that occurred during the prior phase.
4. Ask for code plus a short verification checklist.

After each prompt completes:
1. Run migrations.
2. Test the primary workflow for that phase.
3. Fix defects before moving on.
4. Commit with a phase-specific message.

---

## Suggested Git Milestones

- `phase-0-preflight`
- `phase-1-foundation`
- `phase-2-admin`
- `phase-3-entrant-flow`
- `phase-4-scoresheet`
- `phase-5-results-history`
- `phase-6-polish-deploy`

---

## Future Enhancements

These stay out of the initial execution sequence:
- Realtime judging dashboard
- Best of Show round
- PDF scoresheet export
- Email notifications
- Multi-club support
- Expanded style reference tooltips
