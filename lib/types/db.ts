/**
 * lib/types/db.ts — Hand-written database types mirroring supabase/migrations/0001_init.sql
 *
 * These are maintained by hand so the app has types without running
 * `supabase gen types` (which requires auth/login). Keep in sync with the
 * migration. Money is in integer cents. Timestamps are ISO strings (timestamptz).
 */

// ---------------------------------------------------------------------------
// Enums (string unions mirroring CHECK constraints)
// ---------------------------------------------------------------------------
export type ProspectCodeStatus = 'sent' | 'opened' | 'paid' | 'expired'
export type SiteStatus = 'draft' | 'revealed' | 'live' | 'suspended'
export type ContentAuthor = 'operator' | 'client' | 'ai'
export type NoteStatus = 'open' | 'in_progress' | 'done' | 'rejected'
export type CreditReason =
  | 'signup_grant'
  | 'note_spend'
  | 'subscription_refill'
  | 'topup_purchase'
  | 'refund'
  | 'adjustment'
export type PaymentKind = 'initial_50' | 'topup'

// ISO 8601 timestamp string (Postgres timestamptz serialized by PostgREST).
export type Timestamptz = string
// UUID string.
export type UUID = string
// Arbitrary JSON object/value stored in a jsonb column.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

// ---------------------------------------------------------------------------
// Row types (shape of a SELECT *)
// ---------------------------------------------------------------------------

export interface Profile {
  id: UUID // references auth.users(id)
  email: string | null
  is_operator: boolean
  created_at: Timestamptz
  last_login_at: Timestamptz | null
}

export interface Prospect {
  id: UUID
  first_name: string | null
  email: string | null
  template_id: string | null
  source_note: string | null
  created_by: UUID | null
  created_at: Timestamptz
}

export interface ProspectCode {
  id: UUID
  prospect_id: UUID | null
  code: string | null
  token: string | null
  site_id: UUID | null
  status: ProspectCodeStatus
  reveal_seen_at: Timestamptz | null
  expires_at: Timestamptz | null
  created_at: Timestamptz
}

export interface Template {
  id: string // human-readable slug, e.g. 'alice-r'
  name: string | null
  version: string
  photo_slots: number | null
  photo_manifest: Json
  field_schema: Json
  bundle_path: string | null
}

export interface Site {
  id: UUID
  slug: string | null
  owner_user_id: UUID | null
  template_id: string | null
  template_version: string
  status: SiteStatus
  custom_domain: string | null
  published_at: Timestamptz | null
  created_at: Timestamptz
}

export interface SiteContent {
  id: UUID
  site_id: UUID
  version: number
  content_json: Json | null
  is_published: boolean
  created_by: ContentAuthor | null
  created_at: Timestamptz
}

export interface Photo {
  id: UUID
  site_id: UUID
  slot: string | null
  storage_path: string | null
  width: number | null
  height: number | null
  bytes: number | null
  uploaded_at: Timestamptz
}

export interface Note {
  id: UUID
  site_id: UUID
  author_user_id: UUID | null
  status: NoteStatus
  selector: Json | null
  message: string | null
  screenshot_path: string | null
  credits_charged: boolean
  resulting_content_version: number | null
  created_at: Timestamptz
  resolved_at: Timestamptz | null
  resolved_by: UUID | null
}

export interface CreditLedgerEntry {
  id: UUID
  user_id: UUID | null
  delta: number
  reason: CreditReason
  note_id: UUID | null
  payment_id: UUID | null
  balance_after: number | null
  created_at: Timestamptz
}

export interface Payment {
  id: UUID
  user_id: UUID | null
  prospect_code_id: UUID | null
  stripe_session_id: string | null
  stripe_payment_intent: string | null
  amount_cents: number | null
  currency: string
  kind: PaymentKind | null
  status: string | null
  created_at: Timestamptz
}

export interface Subscription {
  id: UUID
  user_id: UUID | null
  stripe_subscription_id: string | null
  status: string | null
  monthly_credit_allowance: number | null
  current_period_end: Timestamptz | null
  created_at: Timestamptz
}

export interface WebhookEvent {
  stripe_event_id: string
  type: string | null
  received_at: Timestamptz
  processed_at: Timestamptz | null
}

// ---------------------------------------------------------------------------
// Insert helper types (columns with defaults / generated values are optional)
// ---------------------------------------------------------------------------
export type ProfileInsert = Omit<Profile, 'is_operator' | 'created_at' | 'last_login_at'> &
  Partial<Pick<Profile, 'is_operator' | 'created_at' | 'last_login_at'>>

export type ProspectInsert = Omit<Prospect, 'id' | 'created_at'> &
  Partial<Pick<Prospect, 'id' | 'created_at'>>

export type ProspectCodeInsert = Omit<ProspectCode, 'id' | 'status' | 'created_at'> &
  Partial<Pick<ProspectCode, 'id' | 'status' | 'created_at'>>

export type TemplateInsert = Omit<Template, 'version' | 'photo_manifest' | 'field_schema'> &
  Partial<Pick<Template, 'version' | 'photo_manifest' | 'field_schema'>>

export type SiteInsert = Omit<
  Site,
  'id' | 'template_version' | 'status' | 'published_at' | 'created_at'
> &
  Partial<Pick<Site, 'id' | 'template_version' | 'status' | 'published_at' | 'created_at'>>

export type SiteContentInsert = Omit<SiteContent, 'id' | 'is_published' | 'created_at'> &
  Partial<Pick<SiteContent, 'id' | 'is_published' | 'created_at'>>

export type PhotoInsert = Omit<Photo, 'id' | 'uploaded_at'> &
  Partial<Pick<Photo, 'id' | 'uploaded_at'>>

export type NoteInsert = Omit<
  Note,
  'id' | 'status' | 'credits_charged' | 'created_at' | 'resolved_at' | 'resolved_by'
> &
  Partial<
    Pick<Note, 'id' | 'status' | 'credits_charged' | 'created_at' | 'resolved_at' | 'resolved_by'>
  >

export type CreditLedgerInsert = Omit<CreditLedgerEntry, 'id' | 'created_at'> &
  Partial<Pick<CreditLedgerEntry, 'id' | 'created_at'>>

export type PaymentInsert = Omit<Payment, 'id' | 'currency' | 'created_at'> &
  Partial<Pick<Payment, 'id' | 'currency' | 'created_at'>>

export type SubscriptionInsert = Omit<Subscription, 'id' | 'created_at'> &
  Partial<Pick<Subscription, 'id' | 'created_at'>>

export type WebhookEventInsert = Omit<WebhookEvent, 'received_at' | 'processed_at'> &
  Partial<Pick<WebhookEvent, 'received_at' | 'processed_at'>>

// ---------------------------------------------------------------------------
// Aggregate map of all tables (handy for generic helpers)
// ---------------------------------------------------------------------------
export interface Tables {
  profiles: Profile
  prospects: Prospect
  prospect_codes: ProspectCode
  templates: Template
  sites: Site
  site_content: SiteContent
  photos: Photo
  notes: Note
  credit_ledger: CreditLedgerEntry
  payments: Payment
  subscriptions: Subscription
  webhook_events: WebhookEvent
}

export type TableName = keyof Tables
