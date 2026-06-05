-- Fil de conversation IA de l'éditeur (façon Lovable) : un message par ligne.
-- Écritures via service role uniquement (routes /api/site/ai*) ; le owner lit.
create table if not exists public.ai_messages (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid not null references public.sites(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  kind       text not null check (kind in ('text','proposal','commit')),
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_messages_site_created
  on public.ai_messages (site_id, created_at desc);

alter table public.ai_messages enable row level security;

drop policy if exists ai_messages_select_own on public.ai_messages;
create policy ai_messages_select_own
  on public.ai_messages for select
  using (auth.uid() = user_id or public.is_operator());

notify pgrst, 'reload schema';
