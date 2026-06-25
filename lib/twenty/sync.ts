/**
 * lib/twenty/sync.ts — Orchestration de la synchro Akyra → Twenty. SERVEUR.
 *
 * `enqueue()` est la SEULE fonction appelée par les chokepoints (track, webhook
 * email/Stripe). Elle ne fait qu'un insert local dans `twenty_outbox` et ne
 * throw JAMAIS : Twenty down ⇒ aucun webhook ne casse. Le drain (worker/cron)
 * pousse ensuite vers Twenty avec retries/backoff.
 *
 * Propriété des champs : on n'écrit que des champs Akyra-owned (cf. mapping.ts).
 * Seule écriture Twenty-owned tolérée : `closeWon()` à la conversion (idempotent).
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { SUBSCRIPTION_PRICE_CENTS } from "@/lib/pricing";
import {
  prospectToPersonPatch,
  opportunityPatchFor,
  signalToNoteBody,
  twentyDateTime,
  type ProspectRow,
  type ClientContext,
} from "./mapping";
import {
  twentyConfigured,
  twentyEnabled,
  createPerson,
  updatePerson,
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

type OutboxOp = "sync_prospect" | "append_note";
type EnqueueArgs = {
  op: OutboxOp;
  prospectId?: string | null;
  userId?: string | null;
  payload?: Record<string, unknown>;
};

/**
 * Enfile un job de synchro. Best-effort absolu : ne throw jamais, n'attend pas
 * Twenty. Les doublons (dedup_key de note, coalescing sync_prospect) sont gérés
 * par index uniques → une violation 23505 est silencieusement ignorée.
 */
export async function enqueue(admin: Admin, args: EnqueueArgs): Promise<void> {
  if (!twentyConfigured()) return; // Twenty pas branché → on n'empile rien
  try {
    const { error } = await admin.from("twenty_outbox").insert({
      op: args.op,
      prospect_id: args.prospectId ?? null,
      user_id: args.userId ?? null,
      payload: args.payload ?? {},
    });
    if (error && error.code !== "23505") {
      console.warn("[twenty] enqueue:", error.message);
    }
  } catch (e) {
    console.warn("[twenty] enqueue exception:", e instanceof Error ? e.message : e);
  }
}

// =============================================================================
// Résolution prospect & contexte client (faits dérivés côté Akyra)
// =============================================================================

const PROSPECT_COLS =
  "id, first_name, email, phone, instagram, city, category, lead_score, source, twenty_person_id, twenty_opportunity_id";

type ProspectFull = ProspectRow & {
  twenty_person_id: string | null;
  twenty_opportunity_id: string | null;
};

async function loadProspect(admin: Admin, id: string): Promise<ProspectFull | null> {
  const { data } = await admin.from("prospects").select(PROSPECT_COLS).eq("id", id).maybeSingle();
  return (data as ProspectFull | null) ?? null;
}

/** Résout la cible d'un job en prospect_id (direct, sinon via user → site/email). */
async function resolveProspectId(
  admin: Admin,
  row: { prospect_id: string | null; user_id: string | null },
): Promise<string | null> {
  if (row.prospect_id) return row.prospect_id;
  if (!row.user_id) return null;

  // Via les sites possédés par l'utilisateur → prospect_code lié.
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

  // Fallback par email (compte self-serve sans prospect_code).
  const { data: prof } = await admin
    .from("profiles")
    .select("email")
    .eq("id", row.user_id)
    .maybeSingle();
  if (prof?.email) {
    const { data: p } = await admin
      .from("prospects")
      .select("id")
      .eq("email", prof.email)
      .limit(1)
      .maybeSingle();
    if (p?.id) return p.id as string;
  }
  return null;
}

/**
 * Contexte de conversion d'un prospect (payé / essai / compte / MRR), dérivé des
 * journaux Akyra. Tout est un fait — jamais une saisie manuelle.
 */
async function buildClientContext(admin: Admin, p: ProspectFull): Promise<ClientContext> {
  // Codes reveal du prospect → sites + paiements.
  const { data: codes } = await admin
    .from("prospect_codes")
    .select("id, site_id")
    .eq("prospect_id", p.id);
  const codeIds = (codes ?? []).map((c) => c.id);
  const siteIds = (codes ?? []).map((c) => c.site_id).filter(Boolean) as string[];

  // Paiement encaissé (initial_50 ou trial_50 passé `paid`) = client payant.
  let isClient = false;
  let conversionDate: string | null = null;
  if (codeIds.length) {
    const { data: pays } = await admin
      .from("payments")
      .select("kind, status, created_at")
      .in("prospect_code_id", codeIds)
      .in("kind", ["initial_50", "trial_50"])
      .eq("status", "paid")
      .order("created_at", { ascending: true });
    if (pays?.length) {
      isClient = true;
      conversionDate = pays[0].created_at as string;
    }
  }

  // Rattachement à un compte : propriétaire du site, sinon email.
  // On capte aussi l'essai détecté via le statut de facturation du site.
  let userId: string | null = null;
  let siteTrialing = false;
  if (siteIds.length) {
    const { data: owned } = await admin
      .from("sites")
      .select("owner_user_id, billing_status")
      .in("id", siteIds);
    userId = (owned ?? []).map((s) => s.owner_user_id).find(Boolean) ?? null;
    siteTrialing = (owned ?? []).some((s) => s.billing_status === "trialing");
  }
  if (!userId && p.email) {
    const { data: prof } = await admin
      .from("profiles")
      .select("id")
      .eq("email", p.email)
      .maybeSingle();
    userId = prof?.id ?? null;
  }
  const hasAccount = Boolean(userId);

  // Abonnement Stripe (source de MRR + statut payant/essai).
  let isTrialing = false;
  let plan: string | null = null;
  let mrrCents: number | null = null;
  if (userId) {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("status, created_at")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
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
  // Essai via tunnel (carte enregistrée, débit J+3) : trial_50 encore pending.
  if (!isClient && !isTrialing && codeIds.length) {
    const { data: pending } = await admin
      .from("payments")
      .select("id")
      .in("prospect_code_id", codeIds)
      .eq("kind", "trial_50")
      .eq("status", "pending")
      .limit(1);
    if (pending?.length) isTrialing = true;
  }

  return { isClient, isTrialing, hasAccount, plan, mrrCents, conversionDate };
}

// =============================================================================
// Synchro d'un prospect (Person + Opportunity, + Won à la conversion)
// =============================================================================
export async function syncProspect(admin: Admin, prospectId: string): Promise<void> {
  if (!twentyEnabled()) return;
  const p = await loadProspect(admin, prospectId);
  if (!p) return;
  const ctx = await buildClientContext(admin, p);

  // --- Person (upsert, self-healing sur 404) ---
  const personPatch = prospectToPersonPatch(p, ctx);
  let personId = p.twenty_person_id;
  try {
    if (personId) await updatePerson(personId, personPatch);
    else personId = (await createPerson(personPatch)).id ?? null;
  } catch (e) {
    if (e instanceof TwentyNotFoundError) personId = (await createPerson(personPatch)).id ?? null;
    else throw e;
  }
  if (personId && personId !== p.twenty_person_id) {
    await admin.from("prospects").update({ twenty_person_id: personId }).eq("id", prospectId);
  }

  // --- Opportunity (upsert) ---
  const oppPatch = opportunityPatchFor(p, ctx);
  let oppId = p.twenty_opportunity_id;
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

  // --- Conversion → « gagné » (seule écriture Twenty-owned, idempotente) ---
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
  // Stage « gagné ». Par défaut CUSTOMER (stage final standard de Twenty), overridable.
  const won = process.env.TWENTY_WON_STAGE || "CUSTOMER";
  const cur = await getOpportunity(oppId);
  if (cur && (cur as { stage?: string }).stage === won) return;
  // closeDate : format Twenty (secondes, suffixe Z). Optionnel — on le pose si connu.
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
      const prospectId = await resolveProspectId(admin, row);
      if (!prospectId) {
        // Cible non résoluble (ex. client self-serve jamais prospect) : frontière
        // v1 documentée — on clôt proprement plutôt que de boucler.
        await markDone(admin, row.id);
        res.done++;
        continue;
      }
      if (row.op === "append_note") {
        await appendSignalNote(admin, prospectId, (row.payload as Record<string, unknown>) ?? {});
      } else {
        await syncProspect(admin, prospectId);
      }
      await markDone(admin, row.id);
      res.done++;
    } catch (e) {
      const retryable =
        e instanceof TwentyRetryableError || e instanceof TwentyConfigError;
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

async function markDone(admin: Admin, id: string): Promise<void> {
  await admin
    .from("twenty_outbox")
    .update({ status: "done", last_error: null, updated_at: new Date().toISOString() })
    .eq("id", id);
}

/**
 * Passe de réconciliation : enfile une synchro pour les prospects jamais
 * synchronisés, puis pour les plus « périmés » (synchro plus vieille que
 * RECONCILE_STALE_MS). Colonne vertébrale qui rattrape tout push temps réel
 * manqué — le push temps réel couvre l'immédiat, ce balayage couvre les ratés.
 * (PostgREST ne permet pas de comparer deux colonnes ; on s'appuie donc sur
 * l'ancienneté de la synchro, pas sur last_signal_at > twenty_synced_at.)
 * Renvoie le nombre de prospects enfilés.
 */
const RECONCILE_STALE_MS = 6 * 60 * 60_000; // 6 h

export async function reconcileStaleProspects(
  admin: Admin,
  opts: { limit?: number } = {},
): Promise<number> {
  if (!twentyEnabled()) return 0;
  const limit = opts.limit ?? 100;
  const cutoff = new Date(Date.now() - RECONCILE_STALE_MS).toISOString();
  // Jamais synchronisés (null) en premier, puis les synchros les plus anciennes.
  const { data: rows } = await admin
    .from("prospects")
    .select("id")
    .or(`twenty_synced_at.is.null,twenty_synced_at.lt.${cutoff}`)
    .order("twenty_synced_at", { ascending: true, nullsFirst: true })
    .limit(limit);
  let n = 0;
  for (const r of rows ?? []) {
    await enqueue(admin, { op: "sync_prospect", prospectId: r.id });
    n++;
  }
  return n;
}
