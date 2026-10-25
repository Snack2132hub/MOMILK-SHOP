-- MOMILK SHOP — fresh Supabase schema
-- Run once in Supabase SQL Editor on a NEW project.
-- Does not import the repository's demo/localStorage data.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('super_admin', 'editor', 'viewer', 'customer');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  username text unique,
  role public.app_role not null default 'customer',
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(trim(customer_name)) between 1 and 100),
  customer_handle text,
  rating integer not null check (rating between 1 and 5),
  service_type text not null default 'good' check (service_type in ('good', 'bad')),
  comment text not null check (char_length(trim(comment)) between 1 and 5000),
  proof_image_url text,
  likes integer not null default 0 check (likes >= 0),
  status text not null default 'pending' check (status in ('approved', 'pending', 'hidden')),
  is_pinned boolean not null default false,
  admin_reply text,
  verified_slip boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reviews_public_sort_idx
  on public.reviews (status, is_pinned desc, created_at desc);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 200),
  storage_path text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tracks_public_sort_idx on public.tracks (is_active, sort_order);

create table if not exists public.store_settings (
  id boolean primary key default true check (id = true),
  settings jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id, settings)
values (true, jsonb_build_object(
  'storeName', 'MOMILK SHOP',
  'heroTitle', 'Welcome to MOMILK SHOP',
  'businessHours', 'เปิด 09:30 - 23:00 น.',
  'enableBgm', true,
  'autoplayBgm', false,
  'bgmAudioUrl', '',
  'bgmAudioName', ''
))
on conflict (id) do nothing;

create table if not exists public.analytics_daily (
  day date primary key default (now() at time zone 'Asia/Bangkok')::date,
  views bigint not null default 0,
  reviews bigint not null default 0,
  likes bigint not null default 0,
  contact_clicks bigint not null default 0,
  line_clicks bigint not null default 0,
  fb_clicks bigint not null default 0,
  ig_clicks bigint not null default 0
);

create or replace function public.current_user_role()
returns public.app_role
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles
  where id = (select auth.uid()) and status = 'active'
  limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('super_admin', 'editor'), false)
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'super_admin', false)
$$;

-- New Auth users get a customer profile. Promote the first admin manually below.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'username', ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.tracks enable row level security;
alter table public.store_settings enable row level security;
alter table public.analytics_daily enable row level security;

-- Profiles: users can see/update only their own basic profile; role changes are admin-only.
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_super_admin());
drop policy if exists "profiles_update_self_basic" on public.profiles;
create policy "profiles_update_self_basic" on public.profiles
  for update to authenticated using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = public.current_user_role());
drop policy if exists "profiles_admin_manage" on public.profiles;
create policy "profiles_admin_manage" on public.profiles
  for all to authenticated using (public.is_super_admin())
  with check (public.is_super_admin());

-- Public visitors can read only approved reviews and submit pending reviews.
drop policy if exists "reviews_read_approved" on public.reviews;
create policy "reviews_read_approved" on public.reviews
  for select to anon, authenticated using (status = 'approved' or public.is_admin());
drop policy if exists "reviews_public_submit" on public.reviews;
create policy "reviews_public_submit" on public.reviews
  for insert to anon, authenticated
  with check (status = 'pending' and likes = 0 and is_pinned = false and admin_reply is null and verified_slip = false);
drop policy if exists "reviews_admin_update" on public.reviews;
create policy "reviews_admin_update" on public.reviews
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "reviews_admin_delete" on public.reviews;
create policy "reviews_admin_delete" on public.reviews
  for delete to authenticated using (public.is_super_admin());

-- Music metadata is public only when active; file access is controlled by Storage bucket.
drop policy if exists "tracks_read_active" on public.tracks;
create policy "tracks_read_active" on public.tracks
  for select to anon, authenticated using (is_active = true or public.is_admin());
drop policy if exists "tracks_admin_insert" on public.tracks;
create policy "tracks_admin_insert" on public.tracks
  for insert to authenticated with check (public.is_admin());
drop policy if exists "tracks_admin_update" on public.tracks;
create policy "tracks_admin_update" on public.tracks
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "tracks_admin_delete" on public.tracks;
create policy "tracks_admin_delete" on public.tracks
  for delete to authenticated using (public.is_admin());

drop policy if exists "settings_public_read" on public.store_settings;
create policy "settings_public_read" on public.store_settings
  for select to anon, authenticated using (true);
drop policy if exists "settings_admin_update" on public.store_settings;
create policy "settings_admin_update" on public.store_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "settings_admin_insert" on public.store_settings;
create policy "settings_admin_insert" on public.store_settings
  for insert to authenticated with check (public.is_admin());

drop policy if exists "analytics_admin_read" on public.analytics_daily;
create policy "analytics_admin_read" on public.analytics_daily
  for select to authenticated using (public.is_admin());
drop policy if exists "analytics_admin_manage" on public.analytics_daily;
create policy "analytics_admin_manage" on public.analytics_daily
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Public music bucket: only upload music you own or have permission to publish.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('music', 'music', true, 52428800, array['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav'])
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = array['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav'];

drop policy if exists "music_public_listen" on storage.objects;
create policy "music_public_listen" on storage.objects
  for select to anon, authenticated using (bucket_id = 'music');
drop policy if exists "music_admin_upload" on storage.objects;
create policy "music_admin_upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'music' and public.is_admin());
drop policy if exists "music_admin_update" on storage.objects;
create policy "music_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'music' and public.is_admin())
  with check (bucket_id = 'music' and public.is_admin());
drop policy if exists "music_super_admin_delete" on storage.objects;
create policy "music_super_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'music' and public.is_super_admin());

-- After creating your first user in Supabase Authentication, replace the email below:
-- update public.profiles p set role = 'super_admin'
-- from auth.users u where p.id = u.id and u.email = 'YOUR_ADMIN_EMAIL';
