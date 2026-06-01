-- Autorise la raison 'edit_publish' dans le ledger de crédits : l'éditeur
-- no-code (self-service) débite 1 crédit à chaque publication de modifications.
alter table public.credit_ledger drop constraint if exists credit_ledger_reason_check;
alter table public.credit_ledger add constraint credit_ledger_reason_check
  check (reason in (
    'signup_grant','note_spend','subscription_refill',
    'topup_purchase','refund','adjustment','edit_publish'
  ));
notify pgrst, 'reload schema';
