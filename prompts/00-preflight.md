# Prompt 00 — Preflight Planning

Use this prompt before any application code is generated.

```text
We are starting the BrewJudge project. Before writing application code, create a concise implementation checklist for repository setup, Supabase project creation, required environment variables, local development prerequisites, and deployment assumptions.

Context:
- Product: BrewJudge, a small private homebrew competition platform for blind judging and digital BJCP-style scoresheets
- Stack: Next.js 14+ App Router, TypeScript, Tailwind CSS, Supabase, Vercel
- Team size and scale: small club, a few competitions per year, around 10–15 members

Important note:
The originally referenced BJCP style seed URL appears stale. The repository `lrdodge/bjcp-style-data` is reachable, but the referenced raw path currently returns 404 and the visible `json/` files appear to be 2008-era data. Include this as a risk and recommend how to resolve it before Phase 1.

Output:
1. Preflight checklist
2. Risks and decisions that must be locked before coding
3. Recommended repo structure
4. Order of implementation phases
5. Specific go/no-go criteria for moving into Phase 1

Do not generate placeholder app code in this step.
```
