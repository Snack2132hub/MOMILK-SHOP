# Frontend workspace (migration target)

The existing Vite + React storefront currently lives at the repository root. This directory documents the intended destination for the frontend during the staged refactor; application source has **not** been moved here yet so the current Vercel deployment is not broken by a partial move.

## Target layout

- `src/pages/` — storefront and admin page composition
- `src/components/` — shared UI components
- `src/services/` — typed API/data access
- `src/lib/supabase.ts` — browser Supabase client (publishable/anon key only)
- `public/` — static assets

The storefront UI should be moved without redesigning or changing its behavior. Keep Vite's build output as `dist/` and use `VITE_SUPABASE_URL` plus `VITE_SUPABASE_ANON_KEY` at build time.
