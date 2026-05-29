-- Suivi analytics / mini-CRM : événements du funnel de prospection.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  token text,
  site_id uuid references public.sites(id) on delete cascade,
  type text not null check (
    type in ('reveal_opened', 'button_click', 'go_live_clicked', 'purchased')
  ),
  label text,
  created_at timestamptz not null default now()
);

create index if not exists events_token_idx on public.events (token);
create index if not exists events_site_idx on public.events (site_id);
create index if not exists events_type_idx on public.events (type);

alter table public.events enable row level security;

-- Lecture réservée à l'opérateur ; écriture via service_role uniquement (endpoint /api/track).
drop policy if exists events_select_operator on public.events;
create policy events_select_operator on public.events
  for select using (public.is_operator());
