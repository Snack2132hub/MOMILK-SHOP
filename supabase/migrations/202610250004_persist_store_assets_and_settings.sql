-- Storage buckets for persistent storefront assets.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('store-assets', 'store-assets', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']),
  ('music', 'music', true, 52428800, array['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/mp4','audio/aac','audio/x-m4a','audio/webm'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins upload storefront assets" on storage.objects;
create policy "Admins upload storefront assets"
on storage.objects for insert to authenticated
with check (bucket_id in ('store-assets', 'music') and (select public.is_admin()));

drop policy if exists "Admins update storefront assets" on storage.objects;
create policy "Admins update storefront assets"
on storage.objects for update to authenticated
using (bucket_id in ('store-assets', 'music') and (select public.is_admin()))
with check (bucket_id in ('store-assets', 'music') and (select public.is_admin()));

drop policy if exists "Public read storefront assets" on storage.objects;
create policy "Public read storefront assets"
on storage.objects for select to anon, authenticated
using (bucket_id in ('store-assets', 'music'));
