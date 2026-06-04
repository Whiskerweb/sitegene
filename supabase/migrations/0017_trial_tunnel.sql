-- Tunnel essai 3 jours + chatbot d'onboarding.
--
--   sites.billing_status : cycle de facturation du site
--     none → trialing (carte enregistrée, site publié) → paid (débit J+3 OK)
--                                  └→ canceled (annulation client)
--                                  └→ payment_failed (3 débits échoués → dépublié)
--   sites.trial_ends_at        : échéance du débit automatique (now()+3j au setup).
--   sites.trial_charge_attempts: tentatives de débit échouées (max 3).
--   site_onboarding.skipped_questions : clés des questions passées au chatbot
--     (on ne les repose jamais).
--   profiles.stripe_payment_method_id : carte enregistrée au Checkout setup.
--   payments.kind += 'trial_50' (ligne créée `pending` au setup, `paid` à J+3).

alter table public.sites add column if not exists billing_status text not null default 'none'
  check (billing_status in ('none','trialing','paid','canceled','payment_failed'));
alter table public.sites add column if not exists trial_ends_at timestamptz;
alter table public.sites add column if not exists trial_charge_attempts int not null default 0;

alter table public.site_onboarding add column if not exists skipped_questions text[] not null default '{}';

alter table public.profiles add column if not exists stripe_payment_method_id text;

alter table public.payments drop constraint if exists payments_kind_check;
alter table public.payments add constraint payments_kind_check
  check (kind in ('initial_50','topup','subscription','trial_50'));

-- Attribution d'une ligne de paiement au site concerné. Sans cette colonne, un
-- user avec deux essais simultanés verrait les deux lignes `trial_50/pending`
-- mises à jour par le même débit (le worker ne filtrait que sur user_id+kind+status).
-- On désactive le lien (set null) plutôt que de supprimer la trace si le site disparaît.
alter table public.payments add column if not exists site_id uuid references public.sites(id) on delete set null;
create index if not exists idx_payments_site on public.payments (site_id);

-- Le worker de débit scanne les essais arrivés à échéance.
create index if not exists idx_sites_trial_due
  on public.sites (trial_ends_at)
  where billing_status = 'trialing';

-- Étend la contrainte events.type (définie dans 0003) pour autoriser 'trial_started'.
alter table public.events drop constraint if exists events_type_check;
alter table public.events add constraint events_type_check
  check (type in ('reveal_opened', 'button_click', 'go_live_clicked', 'purchased', 'trial_started'));
