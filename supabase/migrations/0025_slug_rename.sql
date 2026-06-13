-- Renommage self-serve du sous-domaine `name.akyra.io`.
-- `slug_changed_at` trace la dernière modification du slug :
--   NULL  ⇒ jamais renommé depuis la mise en ligne → 1er renommage LIBRE
--           (le nom par défaut posé au go-live reste à NULL) ;
--   sinon ⇒ cooldown de 30 jours avant le renommage suivant.
-- L'index `idx_sites_slug` existe déjà (migration 0001).
alter table public.sites
  add column if not exists slug_changed_at timestamptz;
