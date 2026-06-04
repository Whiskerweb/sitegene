// Worker de fin d'essai : débite 50 € (off-session) sur les sites `trialing`
// arrivés à échéance. Idempotent : la ligne payments `trial_50/pending` créée
// au setup (lib/trial.ts) est la trace ; elle passe `paid` au succès.
//
//   npm run trial:worker:once   → traite les essais dus puis s'arrête
//   npm run trial:worker        → boucle (poll toutes les 10 min)
//   DRY_RUN=1 npm run trial:worker:once → log au lieu de débiter
//
// LIMITATION CONNUE (concurrence) : un seul worker doit tourner. Le passage
// payments pending→paid est borné par `.eq("status","pending")` (pas de double
// crédit), mais deux workers en parallèle pourraient créer deux PaymentIntents
// pour le même site avant le premier UPDATE — évité en n'exécutant qu'une instance.
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { sendTrialChargeFailed } from "../lib/email/send.ts";

const ONCE = process.argv.includes("--once");
const DRY_RUN = process.env.DRY_RUN === "1";
const POLL_MS = 10 * 60 * 1000; // 10 min entre deux balayages en mode boucle
const MAX_ATTEMPTS = 3;
const AMOUNT_CENTS = 5000;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Dépublie un site (échec définitif ou anomalie de moyen de paiement). */
async function unpublish(siteId, billingStatus) {
  await admin
    .from("sites")
    .update({ billing_status: billingStatus, status: "draft" })
    .eq("id", siteId);
  const { data: sc } = await admin
    .from("site_content")
    .select("id")
    .eq("site_id", siteId)
    .eq("is_published", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sc) await admin.from("site_content").update({ is_published: false }).eq("id", sc.id);
}

/** Envoi best-effort de la relance d'échec de débit (jamais bloquant). */
async function notifyFailure(siteId, userId) {
  try {
    const { data: u } = await admin.auth.admin.getUserById(userId);
    if (u?.user?.email) {
      await sendTrialChargeFailed(admin, { to: u.user.email });
    }
  } catch (mailErr) {
    log(`site ${siteId}: email relance KO — ${mailErr?.message ?? mailErr}`);
  }
}

async function chargeSite(site) {
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, stripe_payment_method_id")
    .eq("id", site.owner_user_id)
    .maybeSingle();

  // GARDE-FOU PAIEMENT : sans carte enregistrée on ne peut rien débiter →
  // échec définitif + dépublication immédiate (pas de réessai possible).
  if (!profile?.stripe_customer_id || !profile?.stripe_payment_method_id) {
    log(`site ${site.id}: pas de carte enregistrée → payment_failed`);
    await unpublish(site.id, "payment_failed");
    await admin
      .from("payments")
      .update({ status: "failed" })
      .eq("user_id", site.owner_user_id)
      .eq("kind", "trial_50")
      .eq("status", "pending");
    await notifyFailure(site.id, site.owner_user_id);
    return;
  }

  if (DRY_RUN) {
    log(`[dry-run] débiterait 50 € — site ${site.id}, customer ${profile.stripe_customer_id}`);
    return;
  }

  try {
    const pi = await stripe.paymentIntents.create({
      amount: AMOUNT_CENTS,
      currency: "eur",
      customer: profile.stripe_customer_id,
      payment_method: profile.stripe_payment_method_id,
      off_session: true,
      confirm: true,
      description: "Akyra — mise en ligne de votre site (fin d'essai)",
      metadata: { site_id: site.id, flow: "trial_50" },
    });
    // Succès : trace payments pending → paid, site → paid.
    // `.eq("status","pending")` borne l'UPDATE : pas de double crédit possible.
    await admin
      .from("payments")
      .update({ status: "paid", stripe_payment_intent: pi.id })
      .eq("user_id", site.owner_user_id)
      .eq("kind", "trial_50")
      .eq("status", "pending");
    await admin.from("sites").update({ billing_status: "paid" }).eq("id", site.id);
    // Trace analytics — best-effort, jamais bloquante (token:null = pas de prospect).
    try {
      await admin.from("events").insert({ token: null, site_id: site.id, type: "purchased" });
    } catch (evErr) {
      log(`site ${site.id}: event purchased KO — ${evErr?.message ?? evErr}`);
    }
    log(`site ${site.id}: débit OK (${pi.id})`);
  } catch (e) {
    const attempts = (site.trial_charge_attempts ?? 0) + 1;
    log(`site ${site.id}: échec débit (tentative ${attempts}/${MAX_ATTEMPTS}) — ${e?.message ?? e}`);
    if (attempts >= MAX_ATTEMPTS) {
      // 3e échec : on arrête, on dépublie, on clôt la trace de paiement.
      await unpublish(site.id, "payment_failed");
      await admin
        .from("payments")
        .update({ status: "failed" })
        .eq("user_id", site.owner_user_id)
        .eq("kind", "trial_50")
        .eq("status", "pending");
    } else {
      // Réessai au prochain passage : repousse l'échéance de 24 h, le site
      // reste en ligne (billing_status inchangé = 'trialing').
      await admin
        .from("sites")
        .update({
          trial_charge_attempts: attempts,
          trial_ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        })
        .eq("id", site.id);
    }
    await notifyFailure(site.id, site.owner_user_id);
  }
}

async function tick() {
  const { data: due, error } = await admin
    .from("sites")
    .select("id, owner_user_id, trial_ends_at, trial_charge_attempts")
    .eq("billing_status", "trialing")
    .lte("trial_ends_at", new Date().toISOString())
    .limit(50);
  if (error) {
    log(`erreur lecture des essais dus : ${error.message}`);
    return;
  }
  if (!due?.length) {
    log("aucun essai à débiter");
    return;
  }
  log(`${due.length} essai(s) à débiter`);
  for (const site of due) {
    await chargeSite(site);
    await sleep(1000); // 1 s entre deux débits (étale les appels Stripe)
  }
}

log(`Trial worker démarré (${ONCE ? "once" : "boucle"})${DRY_RUN ? " [DRY_RUN]" : ""}.`);
if (ONCE) {
  await tick();
  process.exit(0);
} else {
  for (;;) {
    try {
      await tick();
    } catch (e) {
      log("Erreur boucle:", e?.message ?? e);
    }
    await sleep(POLL_MS);
  }
}
