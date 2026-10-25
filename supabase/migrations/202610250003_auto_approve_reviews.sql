-- Customer reviews are published immediately; admins can hide them later.
alter table public.reviews enable row level security;
grant insert on table public.reviews to anon, authenticated;
grant select on table public.reviews to anon, authenticated;
grant update (status, is_pinned, admin_reply) on table public.reviews to authenticated;

drop policy if exists "reviews_public_submit" on public.reviews;
create policy "reviews_public_submit"
on public.reviews for insert to anon, authenticated
with check (
  status = 'approved' and likes = 0 and is_pinned = false
  and admin_reply is null and verified_slip = false
);

drop policy if exists "reviews_read_approved" on public.reviews;
create policy "reviews_read_approved"
on public.reviews for select to anon, authenticated
using (status = 'approved' or (select public.is_admin()));

drop policy if exists "reviews_admin_moderate" on public.reviews;
create policy "reviews_admin_moderate"
on public.reviews for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
