-- Moteur de prospection à froid + journal d'événements email.
--
-- `outreach`      : état de séquence (initial + relances) par prospect, piloté
--                   par le worker `scripts/outreach-worker.mjs`.
-- `email_events`  : journal des envois et des events Resend (delivered, opened,
--                   bounced, complained, unsubscribed) — transac + prospection.

-- outreach -------------------------------------------------------------------
create table if not exists public.outreach (
  id           uuid primary key default gen_random_uuid(),
  prospect_id  uuid not null references public.prospects(id) on delete cascade,
  status       text not null default 'queued'
                 check (status in (
                   'queued','active','completed',     -- en cours / terminé sans réponse
                   'converted','engaged',             -- a payé / a vu son reveal
                   'unsubscribed','bounced',          -- stop délivrabilité
                   'paused','failed'                  -- manuel / erreur
                 )),
  step         int  not null default 0,   -- nb d'emails déjà envoyés (0 = rien encore)
  max_steps    int  not null default 3,   -- initial + 2 relances
  next_run_at  timestamptz not null default now(),
  last_sent_at timestamptz,
  reveal_token text,                       -- snapshot du token /r/{token}
  unsub_token  text unique not null default encode(gen_random_bytes(16), 'hex'),
  error        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (prospect_id)
);

create index if not exists idx_outreach_due
  on public.outreach (next_run_at)
  where status in ('queued', 'active');

-- email_events ---------------------------------------------------------------
create table if not exists public.email_events (
  id          uuid primary key default gen_random_uuid(),
  outreach_id uuid references public.outreach(id) on delete set null,
  prospect_id uuid references public.prospects(id) on delete set null,
  to_email    text,
  kind        text not null,              -- 'outreach_step' | 'receipt'
  step        int,
  provider_id text,                        -- id message Resend (corrélation webhook)
  event       text not null,              -- 'sent'|'delivered'|'opened'|'clicked'|'bounced'|'complained'|'unsubscribed'|'failed'
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_email_events_provider on public.email_events (provider_id);
create index if not exists idx_email_events_prospect on public.email_events (prospect_id);
create index if not exists idx_email_events_to on public.email_events (to_email);

notify pgrst, 'reload schema';
