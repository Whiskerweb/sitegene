-- Autorise la raison 'ai_edit' : modification de design appliquée par l'IA (Mistral)
-- et validée par le client (débite 1 crédit).
alter table public.credit_ledger drop constraint if exists credit_ledger_reason_check;
alter table public.credit_ledger add constraint credit_ledger_reason_check
  check (reason in (
    'signup_grant','note_spend','subscription_refill','topup_purchase',
    'refund','adjustment','edit_publish','ai_edit'
  ));
notify pgrst, 'reload schema';
