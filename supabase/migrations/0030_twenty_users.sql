-- =============================================================================
-- 0030_twenty_users.sql — Synchro Twenty étendue aux INSCRITS (users), v2
-- =============================================================================
-- Étend le pont Akyra→Twenty (0029) du « prospects seuls » au cycle de vie
-- complet : une fiche Twenty par humain (clé email) agrégeant lead + compte.
-- Additive/idempotente, aucun trigger.
-- =============================================================================

-- Ancrage d'idempotence sur les comptes (profiles) — symétrique de prospects.
alter table public.profiles add column if not exists twenty_person_id      text;
alter table public.profiles add column if not exists twenty_opportunity_id text;
alter table public.profiles add column if not exists twenty_synced_at      timestamptz;

create index if not exists idx_profiles_twenty_person
  on public.profiles (twenty_person_id) where twenty_person_id is not null;
create index if not exists idx_profiles_twenty_synced
  on public.profiles (twenty_synced_at);

-- Nouvel op `sync_contact` (synchro unifiée par email). On reconstruit le CHECK.
alter table public.twenty_outbox drop constraint if exists twenty_outbox_op_check;
alter table public.twenty_outbox
  add constraint twenty_outbox_op_check
  check (op in ('sync_prospect','append_note','sync_contact'));

-- Coalescing des synchros de contact : une seule ligne 'sync_contact' en attente
-- par email (les rows sans email ne coalescent pas — NULL distincts, sans erreur).
create unique index if not exists uq_twenty_outbox_sync_contact_email
  on public.twenty_outbox (lower(payload->>'email'))
  where op = 'sync_contact' and status = 'pending' and (payload ? 'email');

notify pgrst, 'reload schema';
