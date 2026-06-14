-- 0021 — Sites sur-mesure générés par l'IA (design system as prompt).
-- Chaque snapshot peut porter un HTML « shell » bespoke (généré depuis le
-- design-system.md du template + les infos client). Quand présent, ce shell est
-- servi à la place du index.html statique du template ; le content_json continue
-- d'hydrater les data-sg-path/data-sg-img (édition + publication inchangées).
alter table public.site_content
  add column if not exists generated_html text;
