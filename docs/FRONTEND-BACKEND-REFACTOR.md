# MOMILK-SHOP Frontend / Backend Refactor

## Baseline audit

- Frontend: Vite + React + TypeScript SPA, currently at repository root.
- Legacy backend: `server.ts` runs Express and reads/writes `data/db.json` through `/api/db`.
- Deployment: Vercel static SPA rewrite to `index.html`; build command is `npm run build`, output `dist`.
- Database: Supabase migration and browser client exist. Admin authentication has Supabase Auth groundwork, but multiple dashboard mutations still use local state/localStorage or the legacy JSON API.
- Production risk: the legacy file persistence is not durable on Vercel. The static frontend cannot depend on a long-running Express process being present.

## Safe staged plan

1. Keep this refactor on a feature branch; do not change `main` directly.
2. Establish the destination boundaries documented in `frontend/README.md` and `backend/README.md`.
3. Move the existing Vite application to `frontend/` as one atomic change, update Vercel Root Directory and all package/config paths, and verify every import/build before merging.
4. Replace `/api/db` and JSON-file persistence with durable Supabase queries and Vercel Functions only where server-side logic is necessary.
5. Migrate reviews, store settings, tracks, and admin mutations to typed data services; verify RLS and Storage policies.
6. Run install, TypeScript/lint, production build, auth tests, and CRUD persistence tests before opening/merging a production-ready PR.

## Environment variables

Frontend build variables (public only):

- `VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co`
- `VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY`

Never use a Supabase service-role/secret key in a `VITE_*` variable. If server functions require privileged access, use a server-only variable without the `VITE_` prefix and enforce authorization on every request.

## Status

This branch adds migration documentation only. The app has not yet been physically moved into the new folders, and no build/test has been run in this environment. Do not change Vercel's Root Directory to `frontend` until the full move and config updates are complete.
