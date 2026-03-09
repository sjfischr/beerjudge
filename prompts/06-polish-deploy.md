# Prompt 06 — Polish, Deployment, Security Review

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
