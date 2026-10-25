# Backend — MOMILK-SHOP

Vercel serverless API functions live in the repository-root `api/` directory so that Vercel can discover them while the frontend builds from `frontend/`.

- `GET /api/health` checks that server-side Supabase environment variables are present.
- Use Supabase Postgres and Storage for durable persistence; do not use filesystem JSON on Vercel.
- Protected routes must validate the Supabase access token and authorize the user's current `profiles.role` and `profiles.status`.
- Keep privileged keys server-only; never use `VITE_` for secrets.
- Do not use service-role credentials for requests that can safely run under the user's JWT and RLS.

The legacy `/api/db` whole-database JSON contract has been removed from the Express server but the UI migration to normalized Supabase rows remains a separate required step. Do not claim that all dashboard writes are migrated until each action is connected and tested.
