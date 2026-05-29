-- FK manquante : prospect_codes.site_id → sites.id (permet l'embedding PostgREST).
alter table public.prospect_codes
  drop constraint if exists prospect_codes_site_id_fkey;
alter table public.prospect_codes
  add constraint prospect_codes_site_id_fkey
  foreign key (site_id) references public.sites (id) on delete set null;

-- Recharge le cache de schéma PostgREST (sinon l'embed reste introuvable).
notify pgrst, 'reload schema';
