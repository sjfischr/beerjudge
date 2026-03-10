# BrewJudge working instructions

- Primary deployment flow is `git push` to GitHub, which triggers Vercel auto-deploys.
- Keep Vercel project environment variables synchronized with the active local `.env.local` values.
- Set `NEXT_PUBLIC_SITE_URL` to the canonical deployed app URL so Supabase email links return to the Vercel app.
- Use manual Vercel CLI deploys only for first-time linking, verification, or debugging.
- When auth changes affect email confirmation, preserve the public `/auth/callback` route.