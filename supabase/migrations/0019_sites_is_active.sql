-- Permet à l'utilisateur de choisir son site "actif" (design courant)
-- sans en perdre les autres (bibliothèque de designs).
alter table public.sites
  add column if not exists is_active boolean not null default true;

-- Les sites existants restent actifs.
update public.sites set is_active = true where is_active is null;

create index if not exists idx_sites_owner_active
  on public.sites (owner_user_id, is_active, created_at desc);
