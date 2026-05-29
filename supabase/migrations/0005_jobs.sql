-- File de jobs : le dashboard dépose des jobs, le worker local (Claude Code) les exécute.
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('create_site', 'modify_site')),
  status text not null default 'pending'
    check (status in ('pending', 'running', 'done', 'error')),
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  site_id uuid references public.sites (id) on delete set null,
  created_by uuid,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists jobs_status_idx on public.jobs (status, created_at);

alter table public.jobs enable row level security;

drop policy if exists jobs_all_operator on public.jobs;
create policy jobs_all_operator on public.jobs
  for all using (public.is_operator()) with check (public.is_operator());

-- Bucket privé d'intake (photos brutes en attente de traitement par le worker).
insert into storage.buckets (id, name, public)
values ('intake', 'intake', false)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
