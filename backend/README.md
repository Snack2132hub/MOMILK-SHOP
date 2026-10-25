# Backend workspace (migration target)

The legacy Express app in root `server.ts` currently stores data in `data/db.json`. That file-backed persistence is not durable on Vercel and must not be used for production data.

## Target responsibilities

- API routes for privileged operations that must not run in the browser
- Validate the authenticated Supabase user and role on every protected request
- Use server-only environment variables for privileged Supabase operations when needed; never expose them through `VITE_*`
- Store persistent data in Supabase Postgres and audio in Supabase Storage
- Return typed JSON responses and safe errors

## Vercel deployment note

For a Vercel deployment, backend endpoints should be implemented as Vercel Functions (for example, under `api/`) or deployed as a separately hosted server. Do not start a long-running Express listener with `app.listen` as a Vercel function. This directory is a migration target only; production API routes have not yet been moved here.
