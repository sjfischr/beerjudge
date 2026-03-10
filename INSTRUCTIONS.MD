# BrewJudge working instructions

- Primary deployment flow is `git push` to GitHub, which triggers Vercel auto-deploys.
- Keep Vercel project environment variables synchronized with the active local `.env.local` values.
- Use manual Vercel CLI deploys only for first-time linking, verification, or debugging.
- When auth changes affect email confirmation, preserve the public `/auth/callback` route.