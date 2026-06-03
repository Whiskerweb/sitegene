-- =============================================================================
-- 0015_crm_template_categories.sql — mapping template → catégorie TABLE-DRIVEN
-- =============================================================================
-- Le catalogue est passé à 5 catégories actives (lib/categories.ts) avec de
-- nouveaux templates (luxury-wedding, wedding-fine-art, jazz-vocalist,
-- cleaning-services, eco-garden-care, creative-portfolio, health-saas).
-- Le mapping SQL de 0011 (crm_category_for_template) était codé en dur : on le
-- rend piloté par `templates.category` — enregistrer un nouveau template =
-- renseigner UNE colonne, plus jamais de migration. Fallback codé en dur pour
-- les templates pas encore en base + les ids historiques (arelec/eloctix).

alter table public.templates add column if not exists category text;

update public.templates set category = case
    when id in ('alice-r','potozon','target','luxury-wedding','wedding-fine-art') then 'photographe'
    when id in ('jazz-vocalist')                                                  then 'musicien'
    when id in ('cleaning-services','eco-garden-care','arelec','eloctix')         then 'artisan'
    when id in ('creative-portfolio')                                             then 'portfolio'
    when id in ('health-saas')                                                    then 'saas'
    else category
  end
where category is null;

-- STABLE (lit une table) — remplace la version IMMUTABLE de 0011. Utilisée par
-- le trigger BEFORE INSERT sur prospects (0011) et les backfills.
create or replace function public.crm_category_for_template(tpl text)
returns text language sql stable as $$
  select coalesce(
    (select t.category from public.templates t where t.id = tpl),
    case
      when tpl in ('alice-r','potozon','target','luxury-wedding','wedding-fine-art') then 'photographe'
      when tpl in ('jazz-vocalist')                                                  then 'musicien'
      when tpl in ('cleaning-services','eco-garden-care','arelec','eloctix')         then 'artisan'
      when tpl in ('creative-portfolio')                                             then 'portfolio'
      when tpl in ('health-saas')                                                    then 'saas'
    end
  );
$$;

-- Backfill des prospects encore non classés (nouveaux templates inclus).
update public.prospects p
set category = public.crm_category_for_template(p.template_id)
where p.category is null
  and public.crm_category_for_template(p.template_id) is not null;

update public.prospects p
set category = public.crm_category_for_template(s.template_id)
from public.prospect_codes pc
join public.sites s on s.id = pc.site_id
where p.category is null
  and pc.prospect_id = p.id
  and public.crm_category_for_template(s.template_id) is not null;

notify pgrst, 'reload schema';
