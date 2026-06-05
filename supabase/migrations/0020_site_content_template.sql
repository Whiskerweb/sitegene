-- =============================================================================
-- Modèle « 1 site / N peaux » : chaque instantané de contenu porte son template.
-- Un seul site canonique par utilisateur ; les autres lignes (créées par le
-- mécanisme multi-sites abandonné) sont repliées en instantanés sous le canonique.
-- =============================================================================

-- 1) Colonne template_id sur les instantanés de contenu --------------------------
alter table public.site_content
  add column if not exists template_id text;

-- Backfill : chaque snapshot hérite du template de son site.
update public.site_content sc
   set template_id = s.template_id
  from public.sites s
 where sc.site_id = s.id
   and sc.template_id is null;

create index if not exists idx_site_content_site_tpl_ver
  on public.site_content (site_id, template_id, version desc);

-- 2) Consolidation des comptes multi-sites --------------------------------------
-- Pour chaque user ayant >1 site : on garde le canonique (live > is_active > récent)
-- et on replie le contenu le plus récent des autres sites en snapshots template-taggés.
do $$
declare
  rec_user   record;
  canonical  uuid;
  other      record;
  src_json   jsonb;
  src_tpl    text;
  next_ver   int;
begin
  for rec_user in
    select owner_user_id
      from public.sites
     where owner_user_id is not null
     group by owner_user_id
    having count(*) > 1
  loop
    -- Canonique : live d'abord, puis is_active, puis le plus récent.
    select id into canonical
      from public.sites
     where owner_user_id = rec_user.owner_user_id
     order by (status = 'live') desc,
              coalesce(is_active, false) desc,
              created_at desc
     limit 1;

    for other in
      select id, template_id
        from public.sites
       where owner_user_id = rec_user.owner_user_id
         and id <> canonical
    loop
      src_tpl := other.template_id;

      -- Snapshot le plus récent du site à replier.
      select content_json into src_json
        from public.site_content
       where site_id = other.id
       order by version desc
       limit 1;

      -- Replier seulement si le canonique n'a pas déjà une peau pour ce template.
      if src_tpl is not null
         and not exists (
           select 1 from public.site_content
            where site_id = canonical and template_id = src_tpl
         )
      then
        select coalesce(max(version), 0) + 1 into next_ver
          from public.site_content where site_id = canonical;

        insert into public.site_content (site_id, version, content_json, is_published, template_id, created_by)
        values (canonical, next_ver, coalesce(src_json, '{}'::jsonb), false, src_tpl, 'client');

        -- Le user possède désormais ce template (galerie).
        insert into public.marketplace_items (user_id, item_type, item_id, license_code, credits_spent)
        values (rec_user.owner_user_id, 'template', src_tpl, 'AKY-MIGR-' || left(md5(random()::text), 6), 0)
        on conflict (user_id, item_type, item_id) do nothing;
      end if;

      -- Les photos suivent le site canonique.
      update public.photos set site_id = canonical where site_id = other.id;

      -- Supprimer le site replié (cascade : ses anciens snapshots déjà copiés).
      delete from public.sites where id = other.id;
    end loop;

    -- Garantir UN seul snapshot publié par site : la peau courante du canonique.
    update public.site_content
       set is_published = false
     where site_id = canonical;

    update public.site_content sc
       set is_published = true
      from public.sites s
     where sc.site_id = canonical
       and s.id = canonical
       and sc.template_id = s.template_id
       and s.status = 'live'
       and sc.version = (
         select max(version) from public.site_content
          where site_id = canonical and template_id = s.template_id
       );
  end loop;
end $$;
