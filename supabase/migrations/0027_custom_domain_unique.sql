-- Un domaine personnalisé ne peut être branché que sur UN seul site.
-- Sans cette contrainte, deux sites pouvaient stocker le même custom_domain :
-- Vercel accepte (déjà sur le projet) et le lookup byCustomDomain retombe alors
-- sur plusieurs lignes → maybeSingle() en erreur → fallback silencieux vers l'app
-- (les deux sites deviennent injoignables). L'index partiel garantit l'unicité
-- tout en laissant plusieurs sites sans domaine (NULL).
create unique index if not exists sites_custom_domain_unique
  on public.sites (custom_domain)
  where custom_domain is not null;
