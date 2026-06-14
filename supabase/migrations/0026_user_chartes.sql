-- Chartes graphiques personnelles : l'utilisateur enregistre ses propres DA
-- (preset modifié, charte importée, ou composée) sur son COMPTE, pour les
-- réutiliser. Logique côté app : modifier une charte de BASE puis « enregistrer »
-- CRÉE une nouvelle charte ici (avec un nom) ; modifier ensuite SA charte la met
-- à jour en place (pas de doublon). `spec` = CharteSpec (couleurs/fonts/coins/mode).
create table if not exists public.user_chartes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  spec        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_user_chartes_user
  on public.user_chartes (user_id, updated_at desc);

-- RLS : le owner lit ses chartes ; écritures via service role uniquement
-- (les routes /api/foundry/chartes passent par createAdminClient + getUser).
alter table public.user_chartes enable row level security;

drop policy if exists user_chartes_select_own on public.user_chartes;
create policy user_chartes_select_own
  on public.user_chartes for select
  using (auth.uid() = user_id or public.is_operator());

notify pgrst, 'reload schema';
