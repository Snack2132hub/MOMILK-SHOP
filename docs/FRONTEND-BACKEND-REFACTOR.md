# Frontend / Backend refactor status

## Implemented on this branch
- Moved Vite/React source, HTML, and frontend build configuration into `frontend/`.
- Removed the old long-running Express/Vite server entrypoint that wrote to `data/db.json`.
- Configured Vercel to build `frontend/` and serve root-level serverless functions under `api/`.
- Added `GET /api/health` to check server-side Supabase environment configuration.
- Kept Supabase migrations and existing UI component code in place.

## Not yet complete / must test before production
- Several admin dashboard mutations still use the legacy localStorage/whole-database state model. They are **not all migrated** to normalized Supabase tables yet.
- The API health function only checks environment presence; it does not prove database connectivity.
- Build and end-to-end tests need to run in CI/Vercel; no local build result is claimed from this GitHub-only edit.
- Verify auth, review moderation, music upload/playback, settings persistence, and refresh persistence before merging.

## Vercel configuration
Keep the Vercel project Root Directory at repository root. The root `vercel.json` installs/builds from `frontend/`, while Vercel Functions remain in root `api/`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the frontend build. For the health function, set server-only `SUPABASE_URL` and `SUPABASE_ANON_KEY` (publishable/anon key only; no service-role key required for the health check).
