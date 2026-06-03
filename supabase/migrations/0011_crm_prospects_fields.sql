-- =============================================================================
-- 0011_crm_prospects_fields.sql — CRM : enrichissement + état dérivé sur prospects
-- =============================================================================
-- Étend la table `prospects` pour en faire la fiche-contact pivot du CRM :
--   * catégorie métier EXPLICITE (aujourd'hui implicite via template_id)
--   * métadonnées de qualification (coordonnées, entreprise, web, source)
--   * ÉTAT DÉRIVÉ dénormalisé (stage / statut / score / dernières activités)
--     — rempli AUTOMATIQUEMENT par crm_recompute_prospect() (cf. 0012),
--     JAMAIS saisi à la main (sauf pipeline_status manuel PERDU/NON_QUALIFIE).
--
-- `category` est volontairement SANS contrainte CHECK : la liste des verticaux
-- vit côté applicatif (lib/crm/categories.ts) pour pouvoir en ajouter un sans
-- migration et sans toucher la landing (lib/categories.ts). Indexée pour le
-- filtre/tri/reporting par segment — l'objectif #1 du CRM.
-- =============================================================================

-- pg_trgm pour la recherche serveur ilike '%…%' (nom / email / entreprise).
create extension if not exists pg_trgm with schema extensions;

-- --- Catégorie + enrichissement ---------------------------------------------
alter table public.prospects add column if not exists category     text;
alter table public.prospects add column if not exists city         text;
alter table public.prospects add column if not exists phone        text;
alter table public.prospects add column if not exists company_name text;
alter table public.prospects add column if not exists website      text;
alter table public.prospects add column if not exists instagram    text;
alter table public.prospects add column if not exists source       text;
alter table public.prospects add column if not exists custom_fields jsonb not null default '{}'::jsonb;

-- --- État dérivé (piloté par triggers — cf. 0012) ---------------------------
alter table public.prospects add column if not exists pipeline_stage text not null default 'A_CONTACTER'
  check (pipeline_stage in ('A_CONTACTER','CONTACTE','REVEAL_VU','ENGAGE','GO_LIVE_INTENT','CLIENT'));
alter table public.prospects add column if not exists pipeline_status text not null default 'EN_COURS'
  check (pipeline_status in ('EN_COURS','GAGNE','PERDU','NON_QUALIFIE','DESABONNE','BOUNCE'));
alter table public.prospects add column if not exists lead_score        int not null default 0;
alter table public.prospects add column if not exists last_signal_at    timestamptz;
alter table public.prospects add column if not exists last_contacted_at timestamptz;
alter table public.prospects add column if not exists lost_reason       text;

-- --- Index (filtre/tri/recherche côté serveur) ------------------------------
create index if not exists idx_prospects_category        on public.prospects (category);
create index if not exists idx_prospects_pipeline_stage  on public.prospects (pipeline_stage);
create index if not exists idx_prospects_pipeline_status on public.prospects (pipeline_status);
create index if not exists idx_prospects_last_signal_at  on public.prospects (last_signal_at desc nulls last);
create index if not exists idx_prospects_lead_score      on public.prospects (lead_score desc);
create index if not exists idx_prospects_custom_fields   on public.prospects using gin (custom_fields);
create index if not exists idx_prospects_search_trgm
  on public.prospects using gin (
    (coalesce(first_name,'') || ' ' || coalesce(email,'') || ' ' || coalesce(company_name,''))
    extensions.gin_trgm_ops
  );

-- --- Mapping template → catégorie (source SQL, miroir de lib/crm/categories.ts) ---
create or replace function public.crm_category_for_template(tpl text)
returns text language sql immutable as $$
  select case
    when tpl in ('alice-r','potozon','target') then 'photographe'
    when tpl in ('arelec','eloctix')           then 'artisan'
    else null
  end;
$$;

-- Auto-classement à la création (couvre TOUS les chemins : CLI, worker, enroll,
-- landing) — pas besoin de toucher au code applicatif.
create or replace function public.crm_tg_prospect_category() returns trigger
language plpgsql as $$
begin
  if NEW.category is null and NEW.template_id is not null then
    NEW.category := public.crm_category_for_template(NEW.template_id);
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_crm_prospect_category on public.prospects;
create trigger trg_crm_prospect_category
  before insert on public.prospects
  for each row execute function public.crm_tg_prospect_category();

-- --- Backfill catégorie de l'existant ---------------------------------------
update public.prospects p
set category = public.crm_category_for_template(p.template_id)
where p.category is null and public.crm_category_for_template(p.template_id) is not null;

-- Fallback : via le site rattaché (prospect_codes → sites.template_id).
update public.prospects p
set category = public.crm_category_for_template(s.template_id)
from public.prospect_codes pc
join public.sites s on s.id = pc.site_id
where p.category is null
  and pc.prospect_id = p.id
  and public.crm_category_for_template(s.template_id) is not null;

-- RLS : `prospects` a déjà la policy `prospects_all_operator` (0001) — les
-- nouvelles colonnes en héritent. Rien à ajouter.

notify pgrst, 'reload schema';
