-- Fonderie : sites ASSEMBLÉS à partir de composants (plus de template modifiable).
-- La recette (vibe + sections + contenus) vit dans site_content.content_json.__recipe
-- sous la peau 'foundry' — le circuit snapshots/publication (0020) reste inchangé.

-- 1) Pseudo-template 'foundry' : satisfait la FK sites.template_id pour les
--    sites assemblés. Aucun bundle statique (rendu React via /a/<slug>).
insert into public.templates (id, name, version, bundle_path)
values ('foundry', 'Site assemblé (fonderie)', '1', null)
on conflict (id) do nothing;

-- 2) Les composants de section (rare/epic) deviennent achetables en crédits,
--    au même titre que les templates et les effets.
alter table public.marketplace_items drop constraint if exists marketplace_items_item_type_check;
alter table public.marketplace_items add constraint marketplace_items_item_type_check
  check (item_type in ('template', 'effect', 'component'));

notify pgrst, 'reload schema';
