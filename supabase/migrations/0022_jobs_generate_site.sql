-- 0022 — Nouveau type de job : génération de site en tâche de fond (flux onboarding
-- IA « header validé d'abord, puis site complet »).
alter table public.jobs drop constraint if exists jobs_type_check;
alter table public.jobs
  add constraint jobs_type_check
  check (type in ('create_site', 'modify_site', 'generate_site'));

notify pgrst, 'reload schema';
