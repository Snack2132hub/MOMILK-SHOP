-- Repair public review submission RLS without exposing pending reviews.
-- Safe to run repeatedly in Supabase SQL Editor.
alter table public.reviews enable row level security;

grant insert on table public.reviews to anon, authenticated;
grant select on table public.reviews to anon, authenticated;

drop policy if exists "reviews_public_submit" on public.reviews;
create policy "reviews_public_submit"
on public.reviews
for insert
to anon, authenticated
with check (
  status = 'pending'
  and likes = 0
  and is_pinned = false
  and admin_reply is null
  and verified_slip = false
);

-- Public users may read approved reviews only; admins may also read pending/hidden.
drop policy if exists "reviews_read_approved" on public.reviews;
create policy "reviews_read_approved"
on public.reviews
for select
to anon, authenticated
using (
  status = 'approved'
  or (select public.is_admin())
);
