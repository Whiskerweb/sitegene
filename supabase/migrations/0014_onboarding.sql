-- Onboarding self-serve gamifié.
--
-- `site_onboarding` : état d'avancement du parcours guidé d'un client connecté
-- (≠ tunnel de prospection à froid). Source de vérité de l'« intake » (réponses
-- progressives) tant que le site n'est pas finalisé. Un site_onboarding pour un
-- site ; détruit avec le site (cascade).
--
--   intake  : { brief, brand, sector, eventTypes[], techRider, services[],
--               about, contactEmail, contactPhone, hasWebsite, websiteUrl,
--               photoUrls[] } — schéma libre, lu/écrit côté serveur.
--   step    : index d'étape courant (reprise après refresh / redirect auth).
--   candidate_template_ids : modèles proposés au reveal multi-DA.
--   chosen_template_id     : DA retenue par le client.
--
-- NOTE : déjà appliquée en prod (xnjonnamprqrsqeetrtu) le 2026-06-03 via
-- psql pooler aws-1-eu-central-1.

create table if not exists public.site_onboarding (
  site_id                uuid primary key references public.sites(id) on delete cascade,
  intake                 jsonb       not null default '{}'::jsonb,
  step                   int         not null default 0,
  candidate_template_ids text[]      not null default '{}',
  chosen_template_id     text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- RLS : seul le service role (routes serveur) écrit ; pas d'accès client direct.
alter table public.site_onboarding enable row level security;
