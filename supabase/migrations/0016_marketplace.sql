-- Marketplace (page Formules) : ownership des items achetés en crédits.
-- Un template acheté = débloqué à vie (rebascule gratuite) ; un effet acheté =
-- licence unique par compte (code AKY-FX-XXXX affiché au client). Le code
-- source des effets vit dans le repo (lib/effects/) — la base ne stocke que
-- l'ownership et les références appliquées dans site_content.content_json.

-- 1) Items possédés
create table if not exists public.marketplace_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  item_type     text not null check (item_type in ('template','effect')),
  item_id       text not null,           -- slug template OU id effet (repo)
  license_code  text not null,           -- ex. AKY-FX-7K2M9 (affichage)
  credits_spent int  not null default 0,
  created_at    timestamptz not null default now(),
  unique (user_id, item_type, item_id)   -- idempotence des achats
);

create index if not exists idx_marketplace_items_user
  on public.marketplace_items (user_id);

-- 2) Nouvelle raison de ledger : achat d'un item marketplace (débit crédits)
alter table public.credit_ledger drop constraint if exists credit_ledger_reason_check;
alter table public.credit_ledger add constraint credit_ledger_reason_check
  check (reason in (
    'signup_grant','note_spend','subscription_refill','topup_purchase',
    'refund','adjustment','edit_publish','ai_edit','item_purchase'
  ));

-- 3) RLS : le owner lit ses items ; écritures via service role uniquement
--    (l'achat passe par /api/marketplace/purchase avec createAdminClient).
alter table public.marketplace_items enable row level security;

drop policy if exists marketplace_items_select_own on public.marketplace_items;
create policy marketplace_items_select_own
  on public.marketplace_items for select
  using (auth.uid() = user_id or public.is_operator());

notify pgrst, 'reload schema';
