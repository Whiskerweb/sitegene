-- =============================================================================
-- 0029_twenty_sync.sql — Pont de synchro Akyra → Twenty (CRM externe)
-- =============================================================================
-- PURELY ADDITIVE : aucune modification de comportement, aucun trigger.
-- Akyra reste la source de vérité produit ; il POUSSE prospects + clients +
-- signaux vers Twenty (CRM séparé) via son API. La synchro est asynchrone et
-- résiliente : les chokepoints (track/webhook email/webhook Stripe) écrivent
-- seulement une ligne dans `twenty_outbox` (insert local) ; un worker draine la
-- file vers Twenty avec retries/backoff. Si Twenty est down, AUCUN webhook ne
-- casse — exactement la philosophie du moteur CRM (0012 : « ne jamais bloquer
-- l'écriture primaire »).
-- =============================================================================

-- --- Ancrage d'idempotence sur prospects ------------------------------------
-- On stocke localement les ids Twenty (Person/Opportunity) → 1 appel par synchro
-- (pas de lookup), self-healing sur 404 (recréation + ré-écriture de l'id).
alter table public.prospects add column if not exists twenty_person_id      text;
alter table public.prospects add column if not exists twenty_opportunity_id text;
alter table public.prospects add column if not exists twenty_synced_at      timestamptz;

create index if not exists idx_prospects_twenty_person
  on public.prospects (twenty_person_id) where twenty_person_id is not null;
create index if not exists idx_prospects_twenty_opportunity
  on public.prospects (twenty_opportunity_id) where twenty_opportunity_id is not null;

-- --- File d'attente de synchro (outbox pattern) -----------------------------
create table if not exists public.twenty_outbox (
  id              uuid primary key default gen_random_uuid(),
  -- Cible : prospect_id quand on le connaît, sinon user_id (résolu en prospect
  -- par le worker via sites.owner_user_id / email). Au moins un des deux.
  prospect_id     uuid references public.prospects(id) on delete cascade,
  user_id         uuid references public.profiles(id)  on delete cascade,
  op              text not null check (op in ('sync_prospect','append_note')),
  payload         jsonb not null default '{}'::jsonb,
  status          text not null default 'pending' check (status in ('pending','processing','done','failed')),
  attempts        int  not null default 0,
  max_attempts    int  not null default 8,
  next_attempt_at timestamptz not null default now(),
  last_error      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Drain : on sélectionne pending/failed dus, par ancienneté.
create index if not exists idx_twenty_outbox_due
  on public.twenty_outbox (status, next_attempt_at);

-- Coalescing des synchros prospect : une seule ligne 'sync_prospect' en attente
-- par cible (le worker relit l'état DB à jour, donc inutile d'en empiler).
create unique index if not exists uq_twenty_outbox_sync_prospect
  on public.twenty_outbox (prospect_id)
  where op = 'sync_prospect' and status = 'pending' and prospect_id is not null;
create unique index if not exists uq_twenty_outbox_sync_user
  on public.twenty_outbox (user_id)
  where op = 'sync_prospect' and status = 'pending' and user_id is not null;

-- Anti-doublon des notes de timeline (replay webhook) : dedup_key unique et
-- PERSISTANT (même après 'done') → un signal rejoué ne re-poste jamais.
create unique index if not exists uq_twenty_outbox_note_dedup
  on public.twenty_outbox ((payload->>'dedup_key'))
  where op = 'append_note' and (payload ? 'dedup_key');

-- RLS : opérateur only (calqué sur lead_stage_history, 0012). service_role
-- (worker/chokepoints) bypasse la RLS.
alter table public.twenty_outbox enable row level security;
drop policy if exists twenty_outbox_all_operator on public.twenty_outbox;
create policy twenty_outbox_all_operator
  on public.twenty_outbox for all
  using (public.is_operator())
  with check (public.is_operator());

notify pgrst, 'reload schema';
