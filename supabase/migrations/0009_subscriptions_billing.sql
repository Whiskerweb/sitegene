-- Monétisation : achat de crédits à l'unité + abonnement « tout illimité ».
-- La table subscriptions existe déjà (0001) avec status / current_period_end /
-- monthly_credit_allowance / stripe_subscription_id. Il manque seulement de quoi
-- réutiliser le même customer Stripe entre le top-up et l'abonnement.

alter table public.profiles add column if not exists stripe_customer_id text;

create unique index if not exists idx_profiles_stripe_customer
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

notify pgrst, 'reload schema';
