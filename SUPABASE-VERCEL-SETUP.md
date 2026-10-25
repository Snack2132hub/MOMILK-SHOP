# MOMILK SHOP — Supabase + Vercel setup

This repository is a Vite + React SPA. Vercel should build the static frontend; the old `server.ts` Express process and `data/db.json` filesystem storage are not durable/serverless database storage. Supabase is the database/auth/storage service.

## 1. Create a fresh Supabase project

1. Create a project at https://supabase.com/dashboard.
2. Open **SQL Editor → New query**.
3. Paste and run `supabase/migrations/202610250001_initial_schema.sql`.
4. Open **Project Settings → API** and copy the Project URL and the publishable/anon key. Do not copy a service-role/secret key into frontend code.

The SQL starts with empty reviews/tracks/profiles (it does not import the demo data in `src/data/initialDatabase.ts`). It seeds only a basic store settings row.

## 2. Create the first administrator securely

1. In Supabase, open **Authentication → Users → Add user** and create your own admin email/password.
2. Confirm the account if email confirmation is enabled.
3. In SQL Editor, replace the email below with that exact email and run:
   ```sql
   update public.profiles p
   set role = 'super_admin', updated_at = now()
   from auth.users u
   where p.id = u.id and lower(u.email) = lower('YOUR_ADMIN_EMAIL');
   ```
4. Disable public sign-ups in **Authentication → Settings** if you only want the owner to create staff accounts. Do not use the old demo login (`admin / momilk1234`) in production.

## 3. Public music

The migration creates a public Storage bucket named `music` (50 MB per file limit) and policies for public playback and authenticated admin uploads. Upload only music you own or are licensed to publish.

To upload a track from code, use `uploadPublicTrack(file, title)` from `src/lib/supabaseData.ts`. To list public tracks, use `listPublicTracks()`; render the returned `publicUrl` in an HTML `audio` element. Example:

```tsx
<audio controls preload="none" src={track.publicUrl}>
  Your browser does not support audio.
</audio>
```

Public bucket URLs are accessible to anyone with the URL. Do not use this bucket for private audio.

## 4. Local development

From the repository root:

```bash
npm install
```

Create `.env.local` (not committed) with:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Then run `npm run dev`. The client helper is in `src/lib/supabase.ts`, with database/storage operations in `src/lib/supabaseData.ts`.

## 5. Deploy to Vercel

1. Import `Snack2132hub/MOMILK-SHOP` into https://vercel.com/new.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in **Project → Settings → Environment Variables** for Production, Preview, and Development as needed.
6. Redeploy after adding/changing variables.

The included `vercel.json` sends SPA routes to `index.html`.

## Important implementation notes

- Existing storefront UI and its design files are intentionally left in place.
- The old `server.ts` / `/api/db` JSON-file backend is not a suitable Vercel persistence layer. Vercel's deployment should use the Vite build; do not configure the Express server as the production entrypoint.
- The existing `App.tsx` still uses its demo database/localStorage for much of the admin dashboard and review interactions. The new Supabase service functions are the secure foundation, but full live integration requires replacing those state mutations with the service functions and replacing the old demo login with Supabase Auth. Do not treat the old demo login or localStorage as production authentication.
- The database intentionally starts fresh; demo reviews/users in `src/data/initialDatabase.ts` are not imported.
- Only the publishable/anon key belongs in `VITE_...` frontend variables. RLS is the security boundary. Never expose service-role/secret keys in GitHub, client code, or Vercel `VITE_` variables.
