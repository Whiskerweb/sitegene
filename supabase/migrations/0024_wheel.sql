-- 0024_wheel.sql — Roue de la fortune de bienvenue.
-- Un seul spin par compte : wheel_spun_at marque le tirage effectué (et sert
-- de verrou anti-rejeu via un claim atomique « update ... where ... is null »).
alter table public.profiles
  add column if not exists wheel_spun_at timestamptz;

-- Backfill : les comptes existants ont déjà reçu leur don de bienvenue (ancien
-- signup_grant silencieux) — ils ne voient PAS la roue, pour éviter un
-- double-don. Seuls les NOUVEAUX comptes (profil créé après cette migration)
-- la verront au 1er accès au dashboard.
update public.profiles
  set wheel_spun_at = now()
  where wheel_spun_at is null;
