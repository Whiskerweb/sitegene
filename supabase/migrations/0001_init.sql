-- =============================================================================
-- 0001_init.sql — Initial schema for the "cheap website" SaaS platform
-- =============================================================================
-- Conventions:
--   * uuid PKs default gen_random_uuid()  (pgcrypto/pgsodium provides gen_random_uuid;
--     it is built-in in Postgres 13+, which Supabase uses)
--   * money stored in integer cents
--   * timestamps timestamptz default now()
--   * Sensitive writes (credit grants, publishing, user creation, Stripe webhooks)
--     go through the SERVICE ROLE which BYPASSES RLS. Policies below therefore only
--     cover (a) client-side reads/writes by the authenticated owner, (b) operator
--     reads/writes, and (c) anonymous reads of PUBLISHED/LIVE public-site content.
-- =============================================================================

-- gen_random_uuid() is built into pgcrypto; ensure it is available.
create extension if not exists pgcrypto;

-- =============================================================================
-- TABLES
-- =============================================================================

-- profiles -------------------------------------------------------------------
-- 1:1 with auth.users. Auto-populated by handle_new_user() trigger.
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  is_operator   boolean not null default false,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);

-- prospects ------------------------------------------------------------------
-- A lead captured by an operator before any account/site exists.
create table if not exists public.prospects (
  id          uuid primary key default gen_random_uuid(),
  first_name  text,
  email       text,
  template_id text,
  source_note text,
  created_by  uuid,
  created_at  timestamptz not null default now()
);

-- prospect_codes -------------------------------------------------------------
-- A unique reveal code/token sent to a prospect to unlock their preview site.
create table if not exists public.prospect_codes (
  id             uuid primary key default gen_random_uuid(),
  prospect_id    uuid references public.prospects(id) on delete cascade,
  code           text,
  token          text unique,
  site_id        uuid,
  status         text not null default 'sent'
                   check (status in ('sent','opened','paid','expired')),
  reveal_seen_at timestamptz,
  expires_at     timestamptz,
  created_at     timestamptz not null default now()
);

-- templates ------------------------------------------------------------------
-- Catalog of site templates. id is a human-readable slug (e.g. 'alice-r').
create table if not exists public.templates (
  id            text primary key,
  name          text,
  version       text not null default '1',
  photo_slots   int,
  photo_manifest jsonb not null default '{}'::jsonb,
  field_schema  jsonb not null default '{}'::jsonb,
  bundle_path   text
);

-- sites ----------------------------------------------------------------------
create table if not exists public.sites (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique,
  owner_user_id    uuid references public.profiles(id) on delete set null,
  template_id      text references public.templates(id),
  template_version text not null default '1',
  status           text not null default 'draft'
                     check (status in ('draft','revealed','live','suspended')),
  custom_domain    text,
  published_at     timestamptz,
  created_at       timestamptz not null default now()
);

-- site_content ---------------------------------------------------------------
-- Versioned content for a site. Exactly one version per (site_id, version).
create table if not exists public.site_content (
  id           uuid primary key default gen_random_uuid(),
  site_id      uuid not null references public.sites(id) on delete cascade,
  version      int not null,
  content_json jsonb,
  is_published boolean not null default false,
  created_by   text check (created_by in ('operator','client','ai')),
  created_at   timestamptz not null default now(),
  unique (site_id, version)
);

-- photos ---------------------------------------------------------------------
create table if not exists public.photos (
  id           uuid primary key default gen_random_uuid(),
  site_id      uuid not null references public.sites(id) on delete cascade,
  slot         text,
  storage_path text,
  width        int,
  height       int,
  bytes        int,
  uploaded_at  timestamptz not null default now()
);

-- notes ----------------------------------------------------------------------
-- Client feedback / revision requests pinned to a site (and a DOM selector).
create table if not exists public.notes (
  id                       uuid primary key default gen_random_uuid(),
  site_id                  uuid not null references public.sites(id) on delete cascade,
  author_user_id           uuid references public.profiles(id) on delete set null,
  status                   text not null default 'open'
                             check (status in ('open','in_progress','done','rejected')),
  selector                 jsonb,
  message                  text,
  screenshot_path          text,
  credits_charged          boolean not null default false,
  resulting_content_version int,
  created_at               timestamptz not null default now(),
  resolved_at              timestamptz,
  resolved_by              uuid
);

-- credit_ledger --------------------------------------------------------------
-- Append-only ledger. balance_after is a denormalized running balance.
create table if not exists public.credit_ledger (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade,
  delta         int not null,
  reason        text not null
                  check (reason in ('signup_grant','note_spend','subscription_refill','topup_purchase','refund','adjustment')),
  note_id       uuid,
  payment_id    uuid,
  balance_after int,
  created_at    timestamptz not null default now()
);

-- payments -------------------------------------------------------------------
create table if not exists public.payments (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references public.profiles(id) on delete set null,
  prospect_code_id      uuid,
  stripe_session_id     text unique,
  stripe_payment_intent text,
  amount_cents          int,
  currency              text not null default 'eur',
  kind                  text check (kind in ('initial_50','topup')),
  status                text,
  created_at            timestamptz not null default now()
);

-- subscriptions --------------------------------------------------------------
create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid references public.profiles(id) on delete cascade,
  stripe_subscription_id  text unique,
  status                  text,
  monthly_credit_allowance int,
  current_period_end      timestamptz,
  created_at              timestamptz not null default now()
);

-- webhook_events -------------------------------------------------------------
-- Stripe webhook idempotency log. Service-role only; RLS on, no policies.
create table if not exists public.webhook_events (
  stripe_event_id text primary key,
  type            text,
  received_at     timestamptz not null default now(),
  processed_at    timestamptz
);

-- =============================================================================
-- INDEXES (FK lookups + hot read paths)
-- =============================================================================
create index if not exists idx_sites_slug              on public.sites (slug);
create index if not exists idx_sites_owner_user_id      on public.sites (owner_user_id);
create index if not exists idx_prospect_codes_token     on public.prospect_codes (token);
create index if not exists idx_prospect_codes_prospect  on public.prospect_codes (prospect_id);
create index if not exists idx_notes_site_id            on public.notes (site_id);
create index if not exists idx_notes_author             on public.notes (author_user_id);
create index if not exists idx_credit_ledger_user_id    on public.credit_ledger (user_id);
create index if not exists idx_site_content_site_id     on public.site_content (site_id);
create index if not exists idx_photos_site_id           on public.photos (site_id);
create index if not exists idx_payments_user_id         on public.payments (user_id);
create index if not exists idx_subscriptions_user_id    on public.subscriptions (user_id);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- handle_new_user(): auto-create a profiles row when an auth.users row is inserted.
-- SECURITY DEFINER so it runs as the table owner regardless of the inserting role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- is_operator(): true if the current authenticated user is flagged is_operator.
-- STABLE + SECURITY DEFINER so RLS policies can call it without recursing into
-- profiles' own RLS (which would otherwise cause infinite recursion).
create or replace function public.is_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_operator from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- credit_balance(uid): latest balance_after for the user, or 0 if none.
create or replace function public.credit_balance(uid uuid)
returns int
language sql
stable
as $$
  select coalesce(
    (select cl.balance_after
       from public.credit_ledger cl
      where cl.user_id = uid
      order by cl.created_at desc, cl.id desc
      limit 1),
    0
  );
$$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- Enable RLS everywhere. By default (no policy) RLS denies all access to the
-- anon/authenticated roles; the service role always bypasses RLS.
alter table public.profiles       enable row level security;
alter table public.prospects      enable row level security;
alter table public.prospect_codes enable row level security;
alter table public.templates      enable row level security;
alter table public.sites          enable row level security;
alter table public.site_content   enable row level security;
alter table public.photos         enable row level security;
alter table public.notes          enable row level security;
alter table public.credit_ledger  enable row level security;
alter table public.payments       enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.webhook_events enable row level security;
-- webhook_events: RLS enabled, NO policies → only service role can touch it.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy profiles_select_own
  on public.profiles for select
  using (auth.uid() = id or public.is_operator());

create policy profiles_update_own
  on public.profiles for update
  using (auth.uid() = id or public.is_operator())
  with check (auth.uid() = id or public.is_operator());

-- ---------------------------------------------------------------------------
-- templates
-- ---------------------------------------------------------------------------
-- Readable by everyone (anon + authenticated): the public site server needs
-- template metadata to render. Writes are operator-only.
create policy templates_select_all
  on public.templates for select
  using (true);

create policy templates_write_operator
  on public.templates for all
  using (public.is_operator())
  with check (public.is_operator());

-- ---------------------------------------------------------------------------
-- prospects  (operator-only)
-- ---------------------------------------------------------------------------
create policy prospects_all_operator
  on public.prospects for all
  using (public.is_operator())
  with check (public.is_operator());

-- ---------------------------------------------------------------------------
-- prospect_codes  (operator-only)
-- ---------------------------------------------------------------------------
create policy prospect_codes_all_operator
  on public.prospect_codes for all
  using (public.is_operator())
  with check (public.is_operator());

-- ---------------------------------------------------------------------------
-- sites
-- ---------------------------------------------------------------------------
-- Owner can read their own sites.
create policy sites_select_own
  on public.sites for select
  using (auth.uid() = owner_user_id);

-- Anonymous + authenticated: public rendering of LIVE sites.
create policy sites_select_public_live
  on public.sites for select
  using (status = 'live');

-- Operators: full access.
create policy sites_all_operator
  on public.sites for all
  using (public.is_operator())
  with check (public.is_operator());

-- ---------------------------------------------------------------------------
-- site_content
-- ---------------------------------------------------------------------------
-- Owner reads content for sites they own.
create policy site_content_select_own
  on public.site_content for select
  using (
    exists (
      select 1 from public.sites s
      where s.id = site_content.site_id
        and s.owner_user_id = auth.uid()
    )
  );

-- Public rendering: published content of a live site is readable by anyone.
create policy site_content_select_public
  on public.site_content for select
  using (
    is_published = true
    and exists (
      select 1 from public.sites s
      where s.id = site_content.site_id
        and s.status = 'live'
    )
  );

-- Operators: full access.
create policy site_content_all_operator
  on public.site_content for all
  using (public.is_operator())
  with check (public.is_operator());

-- ---------------------------------------------------------------------------
-- photos
-- ---------------------------------------------------------------------------
-- Owner reads photos for sites they own.
create policy photos_select_own
  on public.photos for select
  using (
    exists (
      select 1 from public.sites s
      where s.id = photos.site_id
        and s.owner_user_id = auth.uid()
    )
  );

-- Public rendering: photos of a live site are readable by anyone.
create policy photos_select_public_live
  on public.photos for select
  using (
    exists (
      select 1 from public.sites s
      where s.id = photos.site_id
        and s.status = 'live'
    )
  );

-- Operators: full access.
create policy photos_all_operator
  on public.photos for all
  using (public.is_operator())
  with check (public.is_operator());

-- ---------------------------------------------------------------------------
-- notes
-- ---------------------------------------------------------------------------
-- Owner reads notes on sites they own (covers their own authored notes too).
create policy notes_select_own
  on public.notes for select
  using (
    auth.uid() = author_user_id
    or exists (
      select 1 from public.sites s
      where s.id = notes.site_id
        and s.owner_user_id = auth.uid()
    )
  );

-- Owner can create a note on a site they own.
create policy notes_insert_own
  on public.notes for insert
  with check (
    auth.uid() = author_user_id
    and exists (
      select 1 from public.sites s
      where s.id = notes.site_id
        and s.owner_user_id = auth.uid()
    )
  );

-- Operators: full access.
create policy notes_all_operator
  on public.notes for all
  using (public.is_operator())
  with check (public.is_operator());

-- ---------------------------------------------------------------------------
-- credit_ledger  (read-only for owner; writes via service role only)
-- ---------------------------------------------------------------------------
create policy credit_ledger_select_own
  on public.credit_ledger for select
  using (auth.uid() = user_id or public.is_operator());

-- ---------------------------------------------------------------------------
-- payments  (read-only for owner; writes via service role / Stripe webhook)
-- ---------------------------------------------------------------------------
create policy payments_select_own
  on public.payments for select
  using (auth.uid() = user_id or public.is_operator());

-- ---------------------------------------------------------------------------
-- subscriptions  (read-only for owner; writes via service role / Stripe webhook)
-- ---------------------------------------------------------------------------
create policy subscriptions_select_own
  on public.subscriptions for select
  using (auth.uid() = user_id or public.is_operator());

-- =============================================================================
-- SEED — templates (idempotent)
-- =============================================================================
insert into public.templates (id, name, version, photo_slots, photo_manifest, field_schema, bundle_path)
values
  ('alice-r', 'Alice R.', '1', 13, '{}'::jsonb, '{}'::jsonb, '/_templates/alice-r/'),
  ('potozon', 'Potozon',  '1', 18, '{}'::jsonb, '{}'::jsonb, '/_templates/potozon/'),
  ('target',  'Target',   '1', 15, '{}'::jsonb, '{}'::jsonb, '/_templates/target/')
on conflict (id) do nothing;
