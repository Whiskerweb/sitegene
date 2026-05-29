-- =============================================================================
-- seed.sql — Seed data for local dev / `supabase db reset`
-- =============================================================================
-- Idempotent. The same template seed is also embedded in 0001_init.sql so that
-- a remote `db push` (which does NOT run seed.sql) still gets the catalog rows.
-- photo_manifest / field_schema are '{}' placeholders — they will be populated
-- later from each template's manifest. bundle_path = '/_templates/<id>/'.
-- =============================================================================

insert into public.templates (id, name, version, photo_slots, photo_manifest, field_schema, bundle_path)
values
  ('alice-r', 'Alice R.', '1', 13, '{}'::jsonb, '{}'::jsonb, '/_templates/alice-r/'),
  ('potozon', 'Potozon',  '1', 18, '{}'::jsonb, '{}'::jsonb, '/_templates/potozon/'),
  ('target',  'Target',   '1', 15, '{}'::jsonb, '{}'::jsonb, '/_templates/target/')
on conflict (id) do nothing;
