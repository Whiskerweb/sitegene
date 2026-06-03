// Worker de prospection à froid : envoie la séquence (initial + 2 relances) aux
// prospects enrôlés dans `outreach`, à cadence maîtrisée (warmup délivrabilité).
//
//   npm run outreach:worker        → boucle (poll toutes les 30 s)
//   npm run outreach:worker:once   → traite la file due puis s'arrête
//   DRY_RUN=1 npm run outreach:worker:once   → log au lieu d'envoyer
import { createClient } from "@supabase/supabase-js";
import { sendOutreachStep } from "../lib/email/send.ts";
import { isSuppressed } from "../lib/email/suppress.ts";
import { advanceAfterSend, shouldStop } from "../lib/email/sequence.ts";

const ONCE = process.argv.includes("--once");

// --- Réglages délivrabilité -------------------------------------------------
const BATCH_PER_TICK = 8; // lignes traitées par tick
const SEND_SPACING_MS = 8000; // pause entre deux envois réels
const DAILY_CAP = 60; // plafond d'envois de prospection / jour
const POLL_MS = 30000; // intervalle de poll en mode boucle

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DRY_RUN = process.env.DRY_RUN === "1";

/** Nombre d'emails de prospection déjà envoyés aujourd'hui (cap quotidien). */
async function sentToday() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { count } = await admin
    .from("email_events")
    .select("id", { count: "exact", head: true })
    .eq("kind", "outreach_step")
    .eq("event", "sent")
    .gte("created_at", start.toISOString());
  return count ?? 0;
}

/** Met à jour une ligne outreach. */
async function setOutreach(id, patch) {
  await admin
    .from("outreach")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
}

/** Traite un batch de lignes dues. Renvoie le nombre d'envois effectués. */
async function processBatch() {
  const already = await sentToday();
  let budget = DAILY_CAP - already;
  if (budget <= 0) {
    log(`Plafond quotidien atteint (${already}/${DAILY_CAP}).`);
    return 0;
  }

  const nowIso = new Date().toISOString();
  const { data: rows, error } = await admin
    .from("outreach")
    .select("id, prospect_id, status, step, max_steps, reveal_token, unsub_token, created_at, last_sent_at, prospects(email, first_name)")
    .in("status", ["queued", "active"])
    .lte("next_run_at", nowIso)
    .order("next_run_at", { ascending: true })
    .limit(BATCH_PER_TICK);

  if (error) {
    log("Erreur lecture file:", error.message);
    return 0;
  }
  if (!rows || rows.length === 0) return 0;

  let sent = 0;
  for (const row of rows) {
    if (budget <= 0) break;

    const prospect = Array.isArray(row.prospects) ? row.prospects[0] : row.prospects;
    const email = prospect?.email ?? null;
    if (!email) {
      await setOutreach(row.id, { status: "failed", error: "prospect sans email" });
      continue;
    }

    // Stop délivrabilité : déjà désinscrit / bounce / plainte.
    if (await isSuppressed(admin, email)) {
      await setOutreach(row.id, { status: "unsubscribed" });
      log(`skip ${email} — suppressé`);
      continue;
    }

    // Stop : a payé/périmé, OU vrai engagement reveal APRÈS notre dernier envoi.
    // L'engagement est lu dans `events` (open/clic), jamais le statut 'opened'
    // du code (qui peut venir d'une prévisualisation opérateur pré-campagne).
    if (row.reveal_token) {
      const { data: code } = await admin
        .from("prospect_codes")
        .select("status")
        .eq("token", row.reveal_token)
        .maybeSingle();
      const baseline = row.last_sent_at || row.created_at;
      const { count: engaged } = await admin
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("token", row.reveal_token)
        .in("type", ["reveal_opened", "button_click", "go_live_clicked", "purchased"])
        .gt("created_at", baseline);
      const stop = shouldStop({
        codeStatus: code?.status,
        engagedAfterSend: (engaged ?? 0) > 0,
      });
      if (stop) {
        await setOutreach(row.id, { status: stop });
        log(`stop ${email} — ${stop} (code ${code?.status}, engagé ${engaged ?? 0})`);
        continue;
      }
    }

    // Envoi de l'étape courante (row.step = index de l'email à envoyer).
    try {
      await sendOutreachStep(admin, {
        outreachId: row.id,
        prospectId: row.prospect_id,
        to: email,
        firstName: prospect?.first_name ?? null,
        step: row.step,
        revealToken: row.reveal_token,
        unsubToken: row.unsub_token,
      });
      const next = advanceAfterSend({
        step: row.step,
        maxSteps: row.max_steps,
        nowMs: Date.now(),
      });
      await setOutreach(row.id, {
        step: next.step,
        status: next.status,
        next_run_at: next.next_run_at,
        last_sent_at: new Date().toISOString(),
        error: null,
      });
      sent += 1;
      budget -= 1;
      log(`✓ ${email} — étape ${row.step} → ${next.status}`);
      if (!DRY_RUN) await sleep(SEND_SPACING_MS);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await setOutreach(row.id, { status: "failed", error: msg });
      log(`✗ ${email} — ${msg}`);
    }
  }
  return sent;
}

log(`Outreach worker démarré (${ONCE ? "once" : "boucle"})${DRY_RUN ? " [DRY_RUN]" : ""}.`);
if (ONCE) {
  const n = await processBatch();
  log(`Terminé — ${n} envoi(s).`);
  process.exit(0);
} else {
  while (true) {
    try {
      await processBatch();
    } catch (e) {
      log("Erreur boucle:", e?.message ?? e);
    }
    await sleep(POLL_MS);
  }
}
