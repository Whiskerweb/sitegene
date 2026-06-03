-- =============================================================================
-- 0012_crm_pipeline_engine.sql — Le moteur « auto-update » du CRM
-- =============================================================================
-- Architecture en 2 couches :
--   1. Journaux append-only immuables : events, email_events, payments (la timeline)
--   2. État dérivé sur prospects, recalculé par crm_recompute_prospect()
--
-- POURQUOI un recalcul complet (et pas des updates incrémentaux) :
--   * UNE seule source de vérité → triggers ET backfill utilisent la même logique
--   * IDEMPOTENT et INDÉPENDANT DE L'ORDRE d'arrivée des signaux (un open email
--     tardif après un go_live ne fait pas régresser : le stage = max(rang) des
--     signaux présents, calculé sur tout l'historique)
--   * Les journaux ne font que GROSSIR → l'état dérivé est donc monotone par nature
--
-- service_role bypasse la RLS : l'avancement et l'historique DOIVENT vivre en
-- trigger DB (pas en code applicatif), sinon des transitions seraient manquées
-- selon le chemin d'écriture (webhook Stripe vs Resend vs /api/track).
-- =============================================================================

-- --- Historique des transitions ---------------------------------------------
create table if not exists public.lead_stage_history (
  id              uuid primary key default gen_random_uuid(),
  prospect_id     uuid not null references public.prospects(id) on delete cascade,
  from_stage      text,
  to_stage        text,
  from_status     text,
  to_status       text,
  trigger_event_id uuid,                 -- id (polymorphe) de l'event/email_event/payment déclencheur
  changed_by      text not null default 'system' check (changed_by in ('system','operator')),
  changed_at      timestamptz not null default now()
);
create index if not exists idx_lead_stage_history_prospect on public.lead_stage_history (prospect_id, changed_at desc);

alter table public.lead_stage_history enable row level security;
drop policy if exists lead_stage_history_all_operator on public.lead_stage_history;
create policy lead_stage_history_all_operator
  on public.lead_stage_history for all
  using (public.is_operator())
  with check (public.is_operator());

-- --- Rang ordinal d'un stage (helper réutilisable UI/SQL) -------------------
create or replace function public.crm_stage_rank(stage text)
returns int language sql immutable as $$
  select case stage
    when 'A_CONTACTER'    then 0
    when 'CONTACTE'       then 1
    when 'REVEAL_VU'      then 2
    when 'ENGAGE'         then 3
    when 'GO_LIVE_INTENT' then 4
    when 'CLIENT'         then 5
    else 0 end;
$$;

-- =============================================================================
-- crm_recompute_prospect(prospect, trigger_event_id) — LE recalcul d'état
-- =============================================================================
create or replace function public.crm_recompute_prospect(p_id uuid, p_trigger_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_old_stage   text;
  v_old_status  text;
  v_old_lost    text;
  v_o_status    text;          -- outreach.status (1:1)
  v_threshold   timestamptz;   -- garde-fou : on ignore les events <= last_sent_at (prévisualisations opérateur)
  v_has_sent    boolean;
  v_last_contacted timestamptz;
  v_eclick      boolean;
  v_reveal      boolean;
  v_btn         boolean;
  v_golive      boolean;
  v_purchased   boolean;
  v_paid        boolean;
  v_last_signal timestamptz;
  v_score       int  := 0;
  v_stage       text := 'A_CONTACTER';
  v_status      text;
  v_lost        text;
begin
  select pipeline_stage, pipeline_status, lost_reason
    into v_old_stage, v_old_status, v_old_lost
    from public.prospects where id = p_id for update;
  if not found then return; end if;

  -- Séquence outreach (1:1) : sert au garde-fou + au mapping de statut terminal.
  select status, last_sent_at into v_o_status, v_threshold
    from public.outreach where prospect_id = p_id;

  -- Garde-fou pour les `events` first-party :
  --   pas d'outreach            → -infinity (events réels, hors campagne)
  --   outreach jamais envoyé    → +infinity (ignore prévisualisations opérateur)
  --   sinon                     → last_sent_at
  if v_o_status is null then
    v_threshold := '-infinity'::timestamptz;
  else
    v_threshold := coalesce(v_threshold, 'infinity'::timestamptz);
  end if;

  -- Email de prospection envoyé → CONTACTE (+ last_contacted_at).
  select bool_or(true), max(created_at) into v_has_sent, v_last_contacted
    from public.email_events
    where prospect_id = p_id and event = 'sent' and kind = 'outreach_step';

  -- Clic dans un email → ENGAGE (signal fiable, contrairement aux opens).
  select bool_or(true) into v_eclick
    from public.email_events where prospect_id = p_id and event = 'clicked';

  -- Signaux first-party (reveal/clic/go-live/achat), garde-fou appliqué.
  select bool_or(e.type = 'reveal_opened'),
         bool_or(e.type = 'button_click'),
         bool_or(e.type = 'go_live_clicked'),
         bool_or(e.type = 'purchased')
    into v_reveal, v_btn, v_golive, v_purchased
    from public.events e
    join public.prospect_codes pc on pc.token = e.token
    where pc.prospect_id = p_id and e.created_at > v_threshold;

  -- Paiement initial encaissé (source faisant foi, sans garde-fou).
  v_paid := coalesce(v_purchased, false) or exists (
    select 1 from public.payments pay
    join public.prospect_codes pc on pc.id = pay.prospect_code_id
    where pc.prospect_id = p_id and pay.kind = 'initial_50'
  );

  -- last_signal_at = max de tous les signaux horodatés.
  select max(ts) into v_last_signal from (
    select max(e.created_at) ts
      from public.events e
      join public.prospect_codes pc on pc.token = e.token
      where pc.prospect_id = p_id and e.created_at > v_threshold
    union all
    select max(created_at)
      from public.email_events
      where prospect_id = p_id
        and event in ('sent','delivered','opened','clicked','bounced','complained','unsubscribed')
    union all
    select max(pay.created_at)
      from public.payments pay
      join public.prospect_codes pc on pc.id = pay.prospect_code_id
      where pc.prospect_id = p_id
  ) s;

  -- Score (présence d'un signal, pas par occurrence — température stable).
  if coalesce(v_reveal,false) then v_score := v_score + 15; end if;
  if coalesce(v_btn,false)    then v_score := v_score + 10; end if;
  if coalesce(v_eclick,false) then v_score := v_score + 10; end if;
  if coalesce(v_golive,false) then v_score := v_score + 40; end if;

  -- Stage = plus haut rang atteint (monotone par construction).
  if coalesce(v_has_sent,false)
     or (v_o_status is not null and v_o_status <> 'queued') then v_stage := 'CONTACTE'; end if;
  if coalesce(v_reveal,false)                              then v_stage := 'REVEAL_VU'; end if;
  if coalesce(v_btn,false) or coalesce(v_eclick,false)     then v_stage := 'ENGAGE'; end if;
  if coalesce(v_golive,false)                              then v_stage := 'GO_LIVE_INTENT'; end if;
  if coalesce(v_paid,false)                                then v_stage := 'CLIENT'; end if;

  -- Statut terminal (séparé du stage). Précédence :
  --   payé > deliverability(bounce/desabo) > manuel sticky(PERDU/NON_QUALIFIE) > épuisé(PERDU) > EN_COURS
  if coalesce(v_paid,false) then
    v_status := 'GAGNE';
  elsif v_o_status = 'bounced' then
    v_status := 'BOUNCE';
  elsif v_o_status = 'unsubscribed' then
    v_status := 'DESABONNE';
  elsif v_old_status in ('PERDU','NON_QUALIFIE') then
    v_status := v_old_status;                 -- décision humaine / rotting : on ne l'écrase pas
  elsif v_o_status = 'completed' then
    v_status := 'PERDU';                      -- séquence épuisée sans conversion
  else
    v_status := 'EN_COURS';
  end if;

  -- lost_reason : 'no_response' si perdu par épuisement ; conservé si perte manuelle ; effacé sinon.
  v_lost := case
    when v_status = 'PERDU' and v_o_status = 'completed' and v_old_status <> 'PERDU'
      then coalesce(v_old_lost, 'no_response')
    when v_status in ('PERDU','NON_QUALIFIE') then v_old_lost
    else null
  end;

  update public.prospects set
    pipeline_stage    = v_stage,
    pipeline_status   = v_status,
    lead_score        = v_score,
    last_signal_at    = v_last_signal,
    last_contacted_at = v_last_contacted,
    lost_reason       = v_lost
  where id = p_id;

  -- Trace la transition (stage ou statut).
  if v_stage is distinct from v_old_stage or v_status is distinct from v_old_status then
    insert into public.lead_stage_history
      (prospect_id, from_stage, to_stage, from_status, to_status, trigger_event_id, changed_by)
    values
      (p_id, v_old_stage, v_stage, v_old_status, v_status, p_trigger_id, 'system');
  end if;
end;
$$;

-- =============================================================================
-- crm_set_manual_status() — action opérateur (PERDU / NON_QUALIFIE / réouverture)
-- =============================================================================
create or replace function public.crm_set_manual_status(p_id uuid, p_status text, p_lost_reason text default null)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_old_status text; v_stage text;
begin
  if not public.is_operator() then
    raise exception 'forbidden: operator only';
  end if;
  if p_status not in ('PERDU','NON_QUALIFIE','EN_COURS') then
    raise exception 'invalid manual status: %', p_status;
  end if;

  select pipeline_status, pipeline_stage into v_old_status, v_stage
    from public.prospects where id = p_id for update;
  if not found then return; end if;

  if p_status = 'EN_COURS' then
    -- Réouverture : on relaisse le recalcul décider du statut dérivé.
    update public.prospects set pipeline_status = 'EN_COURS', lost_reason = null where id = p_id;
    perform public.crm_recompute_prospect(p_id, null);
  else
    update public.prospects
      set pipeline_status = p_status, lost_reason = coalesce(p_lost_reason, lost_reason)
      where id = p_id;
  end if;

  if p_status is distinct from v_old_status then
    insert into public.lead_stage_history
      (prospect_id, from_stage, to_stage, from_status, to_status, changed_by)
    values (p_id, v_stage, v_stage, v_old_status, p_status, 'operator');
  end if;
end;
$$;

-- =============================================================================
-- TRIGGERS — chaque insert dans un journal recalcule le prospect concerné
-- =============================================================================
-- IMPORTANT : le recalcul CRM est SECONDAIRE. Il ne doit JAMAIS bloquer
-- l'insertion d'un signal/paiement (tracking, webhook Stripe/Resend). On capture
-- donc toute exception en warning — un bug CRM n'empêche pas de logger un event.
create or replace function public.crm_tg_events() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare v_pid uuid;
begin
  if NEW.token is null then return NEW; end if;
  select pc.prospect_id into v_pid from public.prospect_codes pc where pc.token = NEW.token;
  if v_pid is not null then perform public.crm_recompute_prospect(v_pid, NEW.id); end if;
  return NEW;
exception when others then
  raise warning 'crm_tg_events failed (token=%): %', NEW.token, sqlerrm;
  return NEW;
end; $$;

create or replace function public.crm_tg_email_events() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  if NEW.prospect_id is not null then perform public.crm_recompute_prospect(NEW.prospect_id, NEW.id); end if;
  return NEW;
exception when others then
  raise warning 'crm_tg_email_events failed (prospect=%): %', NEW.prospect_id, sqlerrm;
  return NEW;
end; $$;

create or replace function public.crm_tg_payments() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare v_pid uuid;
begin
  if NEW.prospect_code_id is null then return NEW; end if;
  select pc.prospect_id into v_pid from public.prospect_codes pc where pc.id = NEW.prospect_code_id;
  if v_pid is not null then perform public.crm_recompute_prospect(v_pid, NEW.id); end if;
  return NEW;
exception when others then
  raise warning 'crm_tg_payments failed (code=%): %', NEW.prospect_code_id, sqlerrm;
  return NEW;
end; $$;

-- outreach : le worker / le webhook changent son status (engaged/converted/
-- completed/bounced/unsubscribed). On resynchronise alors le prospect. Le
-- recalcul LIT outreach.status (jamais ne l'écrit) → pas de récursion.
create or replace function public.crm_tg_outreach() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  if NEW.prospect_id is not null then perform public.crm_recompute_prospect(NEW.prospect_id, null); end if;
  return NEW;
exception when others then
  raise warning 'crm_tg_outreach failed (prospect=%): %', NEW.prospect_id, sqlerrm;
  return NEW;
end; $$;

drop trigger if exists trg_crm_events          on public.events;
drop trigger if exists trg_crm_email_events    on public.email_events;
drop trigger if exists trg_crm_payments        on public.payments;
drop trigger if exists trg_crm_outreach_ins    on public.outreach;
drop trigger if exists trg_crm_outreach_upd    on public.outreach;

create trigger trg_crm_events       after insert on public.events       for each row execute function public.crm_tg_events();
create trigger trg_crm_email_events after insert on public.email_events for each row execute function public.crm_tg_email_events();
create trigger trg_crm_payments     after insert on public.payments     for each row execute function public.crm_tg_payments();
create trigger trg_crm_outreach_ins after insert on public.outreach     for each row execute function public.crm_tg_outreach();
create trigger trg_crm_outreach_upd after update of status, last_sent_at on public.outreach
  for each row when (old.status is distinct from new.status or old.last_sent_at is distinct from new.last_sent_at)
  execute function public.crm_tg_outreach();

-- =============================================================================
-- BACKFILL one-shot — recalcule l'état dérivé de tous les prospects existants
-- =============================================================================
do $$
declare r record;
begin
  for r in select id from public.prospects loop
    perform public.crm_recompute_prospect(r.id, null);
  end loop;
end $$;

notify pgrst, 'reload schema';
