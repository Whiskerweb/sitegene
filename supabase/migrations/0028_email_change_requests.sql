-- Changement d'adresse email — flux maîtrisé bout-en-bout.
--
-- On NE s'appuie PAS sur le réglage Supabase Auth `double_confirm_changes`
-- (configurable seulement côté dashboard) : à la place, on émet notre propre
-- token à usage unique, on envoie un email Resend brandé à la NOUVELLE adresse,
-- et la bascule effective (admin.updateUserById + email_confirm) n'a lieu
-- qu'après un clic explicite de l'utilisateur. Résultat : fonctionnel en prod
-- quelle que soit la config du projet distant, et 100 % maîtrisé / journalisé.
--
-- Sécurité : on stocke uniquement le SHA-256 du token (jamais le token en clair).
-- Table strictement serveur — accédée par le service_role (bypass RLS) seulement,
-- aucune policy publique n'est créée (RLS activé = tout est refusé côté client).
create table if not exists public.email_change_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  new_email   text not null,
  token_hash  text not null unique,        -- sha256(token) — le token en clair n'existe que dans l'email
  expires_at  timestamptz not null,
  used_at     timestamptz,                 -- non NULL = lien déjà consommé
  created_at  timestamptz not null default now()
);

create index if not exists email_change_requests_user_idx
  on public.email_change_requests (user_id);

alter table public.email_change_requests enable row level security;
-- Aucune policy : seul le service_role (admin) lit/écrit cette table.
