-- =============================================================================
-- 0002_storage.sql — Storage buckets + policies for the SaaS platform
-- =============================================================================
-- Buckets:
--   * site-photos     PUBLIC  — client/operator-uploaded site photos. Public read
--                               so live sites can render images directly. Path
--                               convention: <site_id>/<slot>.<ext>
--   * note-screenshots PRIVATE — screenshots attached to revision notes. Readable
--                               only by the site owner / operators.
--
-- Storage RLS lives on storage.objects. Uploads/deletes in production go through
-- the SERVICE ROLE (operator pipeline), which bypasses RLS. The policies below
-- cover client-side reads and the public rendering of live-site photos.
-- =============================================================================

insert into storage.buckets (id, name, public)
values
  ('site-photos', 'site-photos', true),
  ('note-screenshots', 'note-screenshots', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- site-photos: public read (bucket is public, but make the policy explicit).
-- ---------------------------------------------------------------------------
drop policy if exists "site_photos_public_read" on storage.objects;
create policy "site_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'site-photos');

-- Operators may write/delete site photos via storage RLS (service role also bypasses).
drop policy if exists "site_photos_operator_write" on storage.objects;
create policy "site_photos_operator_write"
  on storage.objects for all
  using (bucket_id = 'site-photos' and public.is_operator())
  with check (bucket_id = 'site-photos' and public.is_operator());

-- ---------------------------------------------------------------------------
-- note-screenshots: private. Owner (of the owning site) or operator may read.
-- Path convention: <site_id>/<note_id>.<ext> → first path segment is site_id.
-- ---------------------------------------------------------------------------
drop policy if exists "note_screenshots_owner_read" on storage.objects;
create policy "note_screenshots_owner_read"
  on storage.objects for select
  using (
    bucket_id = 'note-screenshots'
    and (
      public.is_operator()
      or exists (
        select 1 from public.sites s
        where s.owner_user_id = auth.uid()
          and s.id::text = (storage.foldername(name))[1]
      )
    )
  );

-- Operators may write/delete screenshots via storage RLS (service role also bypasses).
drop policy if exists "note_screenshots_operator_write" on storage.objects;
create policy "note_screenshots_operator_write"
  on storage.objects for all
  using (bucket_id = 'note-screenshots' and public.is_operator())
  with check (bucket_id = 'note-screenshots' and public.is_operator());
