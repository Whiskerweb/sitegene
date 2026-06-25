/**
 * lib/twenty/sync.ts — Orchestration de la synchro Akyra → Twenty. SERVEUR.
 *
 * `enqueue()` est la SEULE fonction appelée par les chokepoints. Elle ne fait
 * qu'un insert local dans `twenty_outbox` et ne throw JAMAIS : Twenty down ⇒
 * aucun webhook ne casse. Le drain (worker/cron) pousse vers Twenty avec retries.
 *
 * v2 — CRM complet : une fiche Twenty PAR HUMAIN, clé = email, agrégeant le côté
 * lead (prospect) ET le côté compte (profile/user : inscription, dernière
 * connexion, abonnement, client). `syncContact(email)` est la fonction pivot.
 *
 * Propriété des champs : on n'écrit que des champs Akyra-owned (cf. mapping.ts).
 * Seule écriture Twenty-owned tolérée : `closeWon()` à la conversion (idempotent).
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { SUBSCRIPTION_PRICE_CENTS } from "@/lib/pricing";
import {
  prospectToPersonPatch,
  opportunityPatchFor,
  contactToPersonPatch,
  contactOpportunityPatch,
  signalToNoteBody,
  twentyDateTime,
  type ProspectRow,
  type ContactRow,
  type ClientContext,
} from "./mapping";
import {
  twentyConfigured,
  twentyEnabled,
  createPerson,
  updatePerson,
  findPersonByAkyraId,
  findPersonByAkyraUserId,
  findPersonByEmail,
  createOpportunity,
  updateOpportunity,
  getOpportunity,
  createNote,
  linkNoteToPerson,
  TwentyNotFoundError,
  TwentyRetryableError,
  TwentyConfigError,
} from "./client";

type Admin = ReturnType<typeof createAdminClient>;

type OutboxOp = "sync_prospect" | "append_note" | "sync_contact";
type EnqueueArgs = {
  op: OutboxOp;
  prospectId?: string | null;
  userId?: string | null;
  /** Pour sync_contact : clé d'unicité/coalescing (posée en minuscules). */
  email?: string | null;
  payload?: Record<string, unknown>;
};

/**
 * Enfile un job de synchro. Best-effort absolu : ne throw jamais, n'attend pas
 * Twenty. Les doublons (dedup_key de note, coalescing par prospect/user/email)
 * sont gérés par index uniques → une violation 23505 est silencieusement ignorée.
 */
export async function enqueue(admin: Admin, args: EnqueueArgs): Promise<void> {
  if (!twentyConfigured()) return; // Twenty pas branché → on n'empile rien
  try {
    const payload = { ...(args.payload ?? {}) };
    if (args.op === "sync_contact" && args.email) {
      payload.email = args.email.toLowerCase();
    }
    const { error } = await admin.from("twenty_outbox").insert({
      op: args.op,
      prospect_id: args.prospectId ?? null,
      user_id: args.userId ?? null,
      payload,
    });
    if (error && error.code !== "23505") {
      console.warn("[twenty] enqueue:", error.message);
    }
  } catch (e) {
    console.warn("[twenty] enqueue exception:", e instanceof Error ? e.message : e);
  }
}

// =============================================================================
// Contexte de conversion (faits dérivés des journaux Akyra)
// =============================================================================

const PROSPECT_COLS =
  "id, first_name, email, phone, instagram, city, category, lead_score, source, twenty_person_id, twenty_opportunity_id";

type ProspectFull = ProspectRow & {
  twenty_person_id: string | null;
  twenty_opportunity_id: string | null;
};

const isTestSession = (sid: unknown) => String(sid ?? "").startsWith("cs_test_");

/**
 * Contexte client unifié, calculé pour un (prospectId?, userId?, email?). Couvre
 * le flux reveal (paiements via prospect_codes) ET self-serve (paiements/abos via
 * user_id). Ignore les paiements en mode TEST Stripe (cs_test_).
 */
async function buildContactContext(
  admin: Admin,
  src: { prospectId: string | null; userId: string | null; email: string | null },
): Promise<ClientContext> {
  let { userId } = src;
  const { prospectId, email } = src;

  // Codes reveal du prospect → codeIds + siteIds.
  let codeIds: string[] = [];
  let siteIds: string[] = [];
  if (prospectId) {
    const { data: codes } = await admin
      .from("prospect_codes")
      .select("id, site_id")
      .eq("prospect_id", prospectId);
    codeIds = (codes ?? []).map((c) => c.id);
    siteIds = (codes ?? []).map((c) => c.site_id).filter(Boolean) as string[];
  }

  // Rattachement compte : propriétaire du site, sinon email. + essai via site.
  let siteTrialing = false;
  if (siteIds.length) {
    const { data: owned } = await admin
      .from("sites")
      .select("owner_user_id, billing_status")
      .in("id", siteIds);
    if (!userId) userId = (owned ?? []).map((s) => s.owner_user_id).find(Boolean) ?? null;
    if ((owned ?? []).some((s) => s.billing_status === "trialing")) siteTrialing = true;
  }
  if (!userId && email) {
    const { data: prof } = await admin.from("profiles").select("id").ilike("email", email).limit(1);
    userId = prof?.[0]?.id ?? null;
  }
  // Sites possédés en propre (self-serve sans prospect_code) → essai.
  if (userId) {
    const { data: usites } = await admin
      .from("sites")
      .select("billing_status")
      .eq("owner_user_id", userId);
    if ((usites ?? []).some((s) => s.billing_status === "trialing")) siteTrialing = true;
  }

  // Paiements encaissés (initial_50/trial_50, hors test), via codes OU user_id.
  const paidRows: { created_at: string; stripe_session_id: string | null }[] = [];
  if (codeIds.length) {
    const { data } = await admin
      .from("payments")
      .select("created_at, stripe_session_id")
      .in("prospect_code_id", codeIds)
      .in("kind", ["initial_50", "trial_50"])
      .eq("status", "paid");
    paidRows.push(...((data as typeof paidRows) ?? []));
  }
  if (userId) {
    const { data } = await admin
      .from("payments")
      .select("created_at, stripe_session_id")
      .eq("user_id", userId)
      .in("kind", ["initial_50", "trial_50"])
      .eq("status", "paid");
    paidRows.push(...((data as typeof paidRows) ?? []));
  }
  const realPaid = paidRows.filter((p) => !isTestSession(p.stripe_session_id));
  let isClient = realPaid.length > 0;
  let conversionDate: string | null = realPaid.length
    ? realPaid.map((p) => p.created_at).sort()[0]
    : null;

  // Abonnement Stripe (MRR + statut payant/essai).
  let isTrialing = false;
  let plan: string | null = null;
  let mrrCents: number | null = null;
  if (userId) {
    const { data: subs } = await admin
      .from("subscriptions")
      .select("status, created_at")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1);
    const sub = subs?.[0];
    if (sub?.status === "active") {
      isClient = true;
      plan = "abonnement";
      mrrCents = SUBSCRIPTION_PRICE_CENTS;
      conversionDate = conversionDate ?? (sub.created_at as string);
    } else if (sub?.status === "trialing") {
      isTrialing = true;
    }
  }
  if (siteTrialing) isTrialing = true;

  // Essai tunnel (trial_50 encore pending), via codes OU user_id.
  if (!isClient && !isTrialing) {
    const pend: unknown[] = [];
    if (codeIds.length) {
      const { data } = await admin
        .from("payments")
        .select("id")
        .in("prospect_code_id", codeIds)
        .eq("kind", "trial_50")
        .eq("status", "pending")
        .limit(1);
      pend.push(...(data ?? []));
    }
    if (!pend.length && userId) {
      const { data } = await admin
        .from("payments")
        .select("id")
        .eq("user_id", userId)
        .eq("kind", "trial_50")
        .eq("status", "pending")
        .limit(1);
      pend.push(...(data ?? []));
    }
    if (pend.length) isTrialing = true;
  }

  return { isClient, isTrialing, hasAccount: Boolean(userId), plan, mrrCents, conversionDate };
}

// =============================================================================
// syncContact — fiche unifiée (lead + compte), clé email
// =============================================================================

/** Récupère la dernière connexion (auth.users.last_sign_in_at) — best-effort. */
async function fetchLastConnection(admin: Admin, userId: string): Promise<string | null> {
  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    return data?.user?.last_sign_in_at ?? null;
  } catch {
    return null;
  }
}

/** Upsert d'une Person + Opportunity pour un humain (clé email). */
export async function syncContact(admin: Admin, email: string): Promise<void> {
  if (!twentyEnabled()) return;
  const e = email.trim().toLowerCase();
  if (!e) return;

  const { data: prospects } = await admin
    .from("prospects")
    .select(PROSPECT_COLS)
    .ilike("email", e)
    .limit(1);
  const prospect = (prospects?.[0] as ProspectFull | undefined) ?? null;

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, created_at, is_operator, twenty_person_id, twenty_opportunity_id")
    .ilike("email", e)
    .limit(1);
  const profile = profiles?.[0] ?? null;

  if (!prospect && !profile) return;
  // On ne crée pas de fiche CRM pour un opérateur seul (c'est nous).
  if (profile?.is_operator && !prospect) return;

  const userId = (profile?.id as string | undefined) ?? null;
  const contact: ContactRow = {
    prospectId: prospect?.id ?? null,
    userId,
    firstName: prospect?.first_name ?? null,
    email: prospect?.email ?? (profile?.email as string | undefined) ?? e,
    phone: prospect?.phone ?? null,
    instagram: prospect?.instagram ?? null,
    city: prospect?.city ?? null,
    category: prospect?.category ?? null,
    leadScore: prospect?.lead_score ?? null,
    source: prospect?.source ?? null,
    signupDate: (profile?.created_at as string | undefined) ?? null,
    lastConnectionAt: userId ? await fetchLastConnection(admin, userId) : null,
  };

  const ctx = await buildContactContext(admin, {
    prospectId: contact.prospectId,
    userId,
    email: contact.email,
  });

  // --- Person (dédup : id stocké sur prospect OU profile → fusion sans réseau) ---
  let personId = prospect?.twenty_person_id ?? profile?.twenty_person_id ?? null;
  if (!personId) {
    if (userId) personId = (await findPersonByAkyraUserId(userId))?.id ?? null;
    if (!personId && contact.prospectId) {
      personId = (await findPersonByAkyraId(contact.prospectId))?.id ?? null;
    }
    if (!personId && contact.email) personId = (await findPersonByEmail(contact.email))?.id ?? null;
  }
  const personPatch = contactToPersonPatch(contact, ctx);
  try {
    if (personId) await updatePerson(personId, personPatch);
    else personId = (await createPerson(personPatch)).id ?? null;
  } catch (err) {
    if (err instanceof TwentyNotFoundError) personId = (await createPerson(personPatch)).id ?? null;
    else throw err;
  }

  // --- Opportunity ---
  let oppId = prospect?.twenty_opportunity_id ?? profile?.twenty_opportunity_id ?? null;
  const oppPatch = contactOpportunityPatch(contact, ctx);
  try {
    if (oppId) await updateOpportunity(oppId, oppPatch);
    else {
      const body = personId ? { ...oppPatch, pointOfContactId: personId } : oppPatch;
      oppId = (await createOpportunity(body)).id ?? null;
    }
  } catch (err) {
    if (err instanceof TwentyNotFoundError) {
      const body = personId ? { ...oppPatch, pointOfContactId: personId } : oppPatch;
      oppId = (await createOpportunity(body)).id ?? null;
    } else throw err;
  }

  if (ctx.isClient && oppId) await closeWon(oppId, ctx.conversionDate);

  // Écrit les ids sur LES DEUX lignes présentes (idempotent quel que soit le trigger).
  const now = new Date().toISOString();
  const patch = { twenty_person_id: personId, twenty_opportunity_id: oppId, twenty_synced_at: now };
  if (prospect?.id) await admin.from("prospects").update(patch).eq("id", prospect.id);
  if (profile?.id) await admin.from("profiles").update(patch).eq("id", profile.id);
}

// =============================================================================
// syncProspect — délègue à syncContact (email) ; chemin legacy si sans email
// =============================================================================
export async function syncProspect(admin: Admin, prospectId: string): Promise<void> {
  if (!twentyEnabled()) return;
  const { data } = await admin.from("prospects").select("email").eq("id", prospectId).maybeSingle();
  const email = data?.email as string | undefined;
  if (email) return syncContact(admin, email);
  return syncProspectLegacy(admin, prospectId); // prospect sans email : pas de fusion
}

/** Chemin legacy (prospect sans email) : Person/Opportunity keyés akyraProspectId. */
async function syncProspectLegacy(admin: Admin, prospectId: string): Promise<void> {
  const { data: p } = await admin
    .from("prospects")
    .select(PROSPECT_COLS)
    .eq("id", prospectId)
    .maybeSingle();
  if (!p) return;
  const prospect = p as ProspectFull;
  const ctx = await buildContactContext(admin, {
    prospectId: prospect.id,
    userId: null,
    email: prospect.email,
  });

  const personPatch = prospectToPersonPatch(prospect, ctx);
  let personId = prospect.twenty_person_id;
  try {
    if (personId) await updatePerson(personId, personPatch);
    else personId = (await createPerson(personPatch)).id ?? null;
  } catch (e) {
    if (e instanceof TwentyNotFoundError) personId = (await createPerson(personPatch)).id ?? null;
    else throw e;
  }

  const oppPatch = opportunityPatchFor(prospect, ctx);
  let oppId = prospect.twenty_opportunity_id;
  try {
    if (oppId) await updateOpportunity(oppId, oppPatch);
    else {
      const body = personId ? { ...oppPatch, pointOfContactId: personId } : oppPatch;
      oppId = (await createOpportunity(body)).id ?? null;
    }
  } catch (e) {
    if (e instanceof TwentyNotFoundError) {
      const body = personId ? { ...oppPatch, pointOfContactId: personId } : oppPatch;
      oppId = (await createOpportunity(body)).id ?? null;
    } else throw e;
  }

  if (ctx.isClient && oppId) await closeWon(oppId, ctx.conversionDate);

  await admin
    .from("prospects")
    .update({
      twenty_person_id: personId,
      twenty_opportunity_id: oppId,
      twenty_synced_at: new Date().toISOString(),
    })
    .eq("id", prospectId);
}

/** Passe une opportunité en « gagné ». Idempotent : ne réécrit pas si déjà gagné. */
async function closeWon(oppId: string, conversionDate: string | null): Promise<void> {
  const won = process.env.TWENTY_WON_STAGE || "CUSTOMER";
  const cur = await getOpportunity(oppId);
  if (cur && (cur as { stage?: string }).stage === won) return;
  const closeDate = conversionDate ? twentyDateTime(conversionDate) : undefined;
  await updateOpportunity(oppId, closeDate ? { stage: won, closeDate } : { stage: won });
}

/** Ajoute une entrée de timeline (Note) sur la Person du prospect. */
export async function appendSignalNote(
  admin: Admin,
  prospectId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!twentyEnabled()) return;
  let { data: pr } = await admin
    .from("prospects")
    .select("twenty_person_id")
    .eq("id", prospectId)
    .maybeSingle();
  if (!pr?.twenty_person_id) {
    await syncProspect(admin, prospectId); // crée la Person au passage
    ({ data: pr } = await admin
      .from("prospects")
      .select("twenty_person_id")
      .eq("id", prospectId)
      .maybeSingle());
  }
  const personId = pr?.twenty_person_id as string | undefined;
  if (!personId) return;
  const signal = String(payload.signal ?? "");
  const { title } = signalToNoteBody(signal, payload.at as string | undefined);
  const note = await createNote(title);
  if (note.id) await linkNoteToPerson(note.id, personId);
}

// =============================================================================
// Drain de l'outbox (worker / cron)
// =============================================================================
const BACKOFF_BASE_MS = 30_000;
const BACKOFF_CAP_MS = 60 * 60_000; // 1 h

function backoffMs(attempts: number): number {
  return Math.min(BACKOFF_BASE_MS * 2 ** attempts, BACKOFF_CAP_MS);
}

/** Résout l'email cible d'une ligne outbox (payload, sinon user/prospect). */
async function resolveEmail(
  admin: Admin,
  row: { prospect_id: string | null; user_id: string | null; payload: Record<string, unknown> },
): Promise<string | null> {
  const fromPayload = row.payload?.email;
  if (typeof fromPayload === "string" && fromPayload) return fromPayload;
  if (row.user_id) {
    const { data } = await admin.from("profiles").select("email").eq("id", row.user_id).maybeSingle();
    if (data?.email) return data.email as string;
  }
  if (row.prospect_id) {
    const { data } = await admin
      .from("prospects")
      .select("email")
      .eq("id", row.prospect_id)
      .maybeSingle();
    if (data?.email) return data.email as string;
  }
  return null;
}

type DrainResult = { processed: number; done: number; failed: number };

/** Draine jusqu'à `limit` jobs dus. Ne throw jamais (résilience). */
export async function drainOutbox(admin: Admin, opts: { limit?: number } = {}): Promise<DrainResult> {
  const limit = opts.limit ?? 50;
  const res: DrainResult = { processed: 0, done: 0, failed: 0 };
  if (!twentyEnabled()) return res;

  // Reprise : une ligne `processing` depuis > 5 min = worker mort en plein vol.
  const stuck = new Date(Date.now() - 5 * 60_000).toISOString();
  await admin
    .from("twenty_outbox")
    .update({ status: "pending" })
    .eq("status", "processing")
    .lt("updated_at", stuck);

  const { data: rows } = await admin
    .from("twenty_outbox")
    .select("id, prospect_id, user_id, op, payload, attempts, max_attempts")
    .in("status", ["pending", "failed"])
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at", { ascending: true })
    .limit(limit);
  if (!rows?.length) return res;

  for (const row of rows) {
    res.processed++;
    await admin
      .from("twenty_outbox")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", row.id);
    try {
      if (row.op === "sync_contact") {
        const email = await resolveEmail(admin, row);
        if (email) await syncContact(admin, email);
      } else if (row.op === "append_note") {
        const prospectId = await resolveProspectId(admin, row);
        if (prospectId) {
          await appendSignalNote(admin, prospectId, (row.payload as Record<string, unknown>) ?? {});
        }
      } else {
        const prospectId = await resolveProspectId(admin, row);
        if (prospectId) await syncProspect(admin, prospectId);
      }
      await markDone(admin, row.id);
      res.done++;
    } catch (e) {
      const retryable = e instanceof TwentyRetryableError || e instanceof TwentyConfigError;
      const attempts = (row.attempts ?? 0) + 1;
      const terminal = !retryable || attempts >= (row.max_attempts ?? 8);
      await admin
        .from("twenty_outbox")
        .update({
          status: terminal ? "failed" : "pending",
          attempts,
          next_attempt_at: new Date(Date.now() + backoffMs(attempts)).toISOString(),
          last_error: e instanceof Error ? e.message.slice(0, 500) : String(e),
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (terminal) res.failed++;
    }
  }
  return res;
}

/** Résout la cible d'un job en prospect_id (direct, sinon via user → site/email). */
async function resolveProspectId(
  admin: Admin,
  row: { prospect_id: string | null; user_id: string | null },
): Promise<string | null> {
  if (row.prospect_id) return row.prospect_id;
  if (!row.user_id) return null;
  const { data: sites } = await admin.from("sites").select("id").eq("owner_user_id", row.user_id);
  const siteIds = (sites ?? []).map((s) => s.id);
  if (siteIds.length) {
    const { data: codes } = await admin
      .from("prospect_codes")
      .select("prospect_id")
      .in("site_id", siteIds)
      .not("prospect_id", "is", null)
      .limit(1);
    if (codes?.[0]?.prospect_id) return codes[0].prospect_id as string;
  }
  const { data: prof } = await admin
    .from("profiles")
    .select("email")
    .eq("id", row.user_id)
    .maybeSingle();
  if (prof?.email) {
    const { data: p } = await admin
      .from("prospects")
      .select("id")
      .ilike("email", prof.email)
      .limit(1);
    if (p?.[0]?.id) return p[0].id as string;
  }
  return null;
}

async function markDone(admin: Admin, id: string): Promise<void> {
  await admin
    .from("twenty_outbox")
    .update({ status: "done", last_error: null, updated_at: new Date().toISOString() })
    .eq("id", id);
}

// =============================================================================
// Réconciliation : balaye prospects ET inscrits (profiles), garde tout frais
// =============================================================================
const RECONCILE_STALE_MS = 6 * 60 * 60_000; // 6 h

/**
 * RAFRAÎCHISSEUR : re-synchronise les contacts DÉJÀ dans Twenty dont la synchro
 * date de plus de 6 h (prospects ET inscrits). Garde lead_score / dernière
 * connexion / statut client à jour. Ne DÉCOUVRE PAS de nouveaux contacts — c'est
 * volontaire : la découverte passe par les hooks temps réel (vraies inscriptions/
 * conversions) et le backfill explicite, pour ne jamais aspirer le junk (prospects
 * sans email, emails jetables, etc.). Renvoie le nombre enfilé.
 */
export async function reconcileStaleContacts(
  admin: Admin,
  opts: { limit?: number } = {},
): Promise<number> {
  if (!twentyEnabled()) return 0;
  const limit = opts.limit ?? 100;
  const half = Math.max(1, Math.floor(limit / 2));
  const cutoff = new Date(Date.now() - RECONCILE_STALE_MS).toISOString();
  let n = 0;

  // Prospects déjà synchronisés et périmés.
  const { data: ps } = await admin
    .from("prospects")
    .select("id, email")
    .not("twenty_synced_at", "is", null)
    .lt("twenty_synced_at", cutoff)
    .order("twenty_synced_at", { ascending: true })
    .limit(half);
  for (const r of ps ?? []) {
    if (r.email) await enqueue(admin, { op: "sync_contact", email: r.email as string, prospectId: r.id });
    else await enqueue(admin, { op: "sync_prospect", prospectId: r.id });
    n++;
  }

  // Inscrits déjà synchronisés et périmés (hors opérateurs).
  const { data: us } = await admin
    .from("profiles")
    .select("id, email")
    .eq("is_operator", false)
    .not("email", "is", null)
    .not("twenty_synced_at", "is", null)
    .lt("twenty_synced_at", cutoff)
    .order("twenty_synced_at", { ascending: true })
    .limit(half);
  for (const r of us ?? []) {
    await enqueue(admin, { op: "sync_contact", email: r.email as string, userId: r.id });
    n++;
  }

  return n;
}
