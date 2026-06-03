-- =============================================================================
-- 0013_crm_views_reporting.sql — Fiche unifiée, cohortes & reporting
-- =============================================================================
-- * v_prospect_timeline      : LA fiche prospect unifiée (UNION de l'existant),
--                              à coût quasi nul — n'invente aucune source de vérité.
-- * campaigns / campaign_id  : cohortes de prospection (comparer les vagues).
-- * v_crm_funnel_by_category : taux de conversion par segment métier.
-- * v_crm_revenue_monthly    : revenu net-new (cash one-off) vs topups.
--
-- Toutes les vues sont en `security_invoker = true` → elles respectent la RLS
-- opérateur des tables sous-jacentes (un non-opérateur ne voit rien).
-- =============================================================================

-- --- Cohortes / campagnes ----------------------------------------------------
create table if not exists public.campaigns (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  category   text,
  started_at timestamptz not null default now(),
  segment    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.campaigns enable row level security;
drop policy if exists campaigns_all_operator on public.campaigns;
create policy campaigns_all_operator
  on public.campaigns for all
  using (public.is_operator())
  with check (public.is_operator());

alter table public.prospects add column if not exists campaign_id uuid;
create index if not exists idx_prospects_campaign on public.prospects (campaign_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'prospects_campaign_id_fkey'
  ) then
    alter table public.prospects
      add constraint prospects_campaign_id_fkey
      foreign key (campaign_id) references public.campaigns(id) on delete set null;
  end if;
end $$;

-- =============================================================================
-- v_prospect_timeline — toute l'histoire d'un prospect, une ligne par signal
-- =============================================================================
create or replace view public.v_prospect_timeline
  with (security_invoker = true) as
  -- Emails (envois + events Resend)
  select ee.prospect_id,
         ee.created_at                       as ts,
         'email'::text                       as channel,
         ee.event                            as kind,
         coalesce(ee.kind,'')                as label,
         ee.meta                             as meta
    from public.email_events ee
    where ee.prospect_id is not null
  union all
  -- Signaux first-party du reveal (token → prospect)
  select pc.prospect_id, e.created_at, 'site', e.type, coalesce(e.label,''), '{}'::jsonb
    from public.events e
    join public.prospect_codes pc on pc.token = e.token
    where pc.prospect_id is not null
  union all
  -- Paiements
  select pc.prospect_id, pay.created_at, 'payment', coalesce(pay.kind,'payment'),
         coalesce(pay.status,''),
         jsonb_build_object('amount_cents', pay.amount_cents, 'currency', pay.currency)
    from public.payments pay
    join public.prospect_codes pc on pc.id = pay.prospect_code_id
    where pc.prospect_id is not null
  union all
  -- Demandes de modification (notes client) via le site
  select pc.prospect_id, n.created_at, 'note', n.status, coalesce(left(n.message,140),''), '{}'::jsonb
    from public.notes n
    join public.prospect_codes pc on pc.site_id = n.site_id
    where pc.prospect_id is not null
  union all
  -- Transitions de pipeline
  select h.prospect_id, h.changed_at, 'stage', coalesce(h.to_stage,''),
         coalesce(h.from_stage,'') || ' → ' || coalesce(h.to_stage,'')
           || case when h.to_status is distinct from h.from_status
                   then ' [' || coalesce(h.to_status,'') || ']' else '' end,
         jsonb_build_object('changed_by', h.changed_by)
    from public.lead_stage_history h;

-- =============================================================================
-- v_crm_funnel_by_category — entonnoir de conversion par segment métier
-- =============================================================================
create or replace view public.v_crm_funnel_by_category
  with (security_invoker = true) as
  select
    coalesce(category, '(non classé)')                                                   as category,
    count(*)                                                                             as total,
    count(*) filter (where public.crm_stage_rank(pipeline_stage) >= 1)                   as contactes,
    count(*) filter (where public.crm_stage_rank(pipeline_stage) >= 2)                   as reveal_vu,
    count(*) filter (where public.crm_stage_rank(pipeline_stage) >= 4)                   as go_live,
    count(*) filter (where pipeline_status = 'GAGNE')                                     as clients,
    count(*) filter (where pipeline_status = 'PERDU')                                     as perdus,
    round(
      100.0 * count(*) filter (where pipeline_status = 'GAGNE')
      / nullif(count(*) filter (where public.crm_stage_rank(pipeline_stage) >= 2), 0), 1
    )                                                                                    as taux_reveal_to_client_pct
  from public.prospects
  group by 1
  order by clients desc, total desc;

-- =============================================================================
-- v_crm_revenue_monthly — revenu net-new (cash one-off) vs topups
-- =============================================================================
create or replace view public.v_crm_revenue_monthly
  with (security_invoker = true) as
  select
    date_trunc('month', created_at)                              as month,
    coalesce(sum(amount_cents) filter (where kind = 'initial_50'), 0) as initial_cents,
    coalesce(sum(amount_cents) filter (where kind = 'topup'), 0)      as topup_cents,
    count(*) filter (where kind = 'initial_50')                       as nb_initial
  from public.payments
  group by 1
  order by 1 desc;

notify pgrst, 'reload schema';
