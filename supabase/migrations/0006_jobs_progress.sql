-- Suivi de progression des jobs (affiché en temps réel dans /admin/new).
alter table public.jobs add column if not exists progress text;
alter table public.jobs add column if not exists progress_at timestamptz;
notify pgrst, 'reload schema';
