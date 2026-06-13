/**
 * Smoke-test Stripe — PRODUCTION (mode LIVE). Vérifie de bout en bout que les
 * paiements (packs + abonnements) sont bien enregistrés côté Stripe ET côté DB.
 *
 * PRUDENCE : ce script est par défaut EN LECTURE SEULE. Les seules opérations
 * d'écriture (remboursement, annulation d'abonnement) exigent un flag explicite
 * et impriment le détail AVANT d'agir. Aucun secret n'est jamais affiché.
 *
 * Usage :
 *   node scripts/stripe-smoke-test.mjs config            # config (lecture seule)
 *   node scripts/stripe-smoke-test.mjs verify-pack       # dernier achat de pack
 *   node scripts/stripe-smoke-test.mjs verify-sub        # dernier abonnement
 *   node scripts/stripe-smoke-test.mjs refund <pi_id> --yes      # rembourse un PaymentIntent
 *   node scripts/stripe-smoke-test.mjs cancel-sub <sub_id> --yes # annule un abonnement (fin de période)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Chargement .env.local (parser minimal, aucune dépendance) ---
function loadEnv() {
  const path = resolve(__dirname, "..", ".env.local");
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}
const ENV = loadEnv();
const SK = ENV.STRIPE_SECRET_KEY;
if (!SK || !SK.startsWith("sk_")) {
  console.error("❌ STRIPE_SECRET_KEY introuvable dans .env.local");
  process.exit(1);
}
const LIVE = SK.startsWith("sk_live_");
const SUPA_URL = ENV.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;

// --- Mini client Stripe (REST, sans SDK) ---
async function stripe(path, { method = "GET", body } = {}) {
  const opts = {
    method,
    headers: { Authorization: `Bearer ${SK}` },
  };
  if (body) {
    opts.headers["Content-Type"] = "application/x-www-form-urlencoded";
    opts.body = new URLSearchParams(body).toString();
  }
  const res = await fetch(`https://api.stripe.com/v1/${path}`, opts);
  const json = await res.json();
  if (json.error) throw new Error(`Stripe ${path}: ${json.error.message}`);
  return json;
}

// --- Mini client Supabase (REST) ---
async function supa(table, query) {
  if (!SUPA_URL || !SUPA_KEY) return null; // DB optionnelle
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
  });
  if (!res.ok) return null;
  return res.json();
}

const ok = (m) => console.log(`  ✅ ${m}`);
const ko = (m) => console.log(`  ❌ ${m}`);
const info = (m) => console.log(`  ·  ${m}`);

// ---------------------------------------------------------------------------
async function cmdConfig() {
  console.log(`\n=== CONFIG STRIPE (${LIVE ? "LIVE" : "TEST"}) ===`);
  const acct = await stripe("account");
  acct.charges_enabled ? ok(`compte ${acct.id} — charges activées`) : ko("charges DÉSACTIVÉES");
  acct.payouts_enabled ? ok("payouts activés") : ko("payouts désactivés");

  for (const [name, id, cents, interval] of [
    ["mensuel", ENV.STRIPE_SUBSCRIPTION_PRICE_ID, 1499, "month"],
    ["annuel", ENV.STRIPE_SUBSCRIPTION_ANNUAL_PRICE_ID, 14900, "year"],
  ]) {
    if (!id) { ko(`price ${name} manquant (env)`); continue; }
    const p = await stripe(`prices/${id}`);
    const good = p.active && p.unit_amount === cents && p.recurring?.interval === interval && p.livemode === LIVE;
    (good ? ok : ko)(`price ${name}: ${p.unit_amount} ${p.currency}/${p.recurring?.interval} (actif ${p.active}, live ${p.livemode})`);
  }

  const wh = await stripe("webhook_endpoints?limit=10");
  const need = ["checkout.session.completed", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "invoice.paid"];
  const ep = wh.data.find((w) => w.status === "enabled" && w.livemode === LIVE);
  if (!ep) ko("aucun webhook actif en LIVE");
  else {
    ok(`webhook ${ep.url} (${ep.status})`);
    const missing = need.filter((e) => !ep.enabled_events.includes(e) && !ep.enabled_events.includes("*"));
    missing.length ? ko(`événements manquants: ${missing.join(", ")}`) : ok("5 événements requis présents");
  }

  const portal = await stripe("billing_portal/configurations?limit=3");
  const active = portal.data.find((c) => c.active);
  (active ? ok : ko)(active ? `portail configuré (${active.id}, default ${active.is_default})` : "portail NON configuré");
}

// ---------------------------------------------------------------------------
async function cmdVerifyPack() {
  console.log("\n=== VÉRIF DERNIER ACHAT DE PACK (topup) ===");
  const sessions = await stripe("checkout/sessions?limit=20");
  const s = sessions.data.find((x) => x.metadata?.kind === "topup");
  if (!s) { ko("aucune session topup trouvée — fais un achat de pack sur /dashboard/credits d'abord"); return; }
  info(`session ${s.id}`);
  (s.payment_status === "paid" ? ok : ko)(`payment_status=${s.payment_status}`);

  const piId = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
  if (piId) {
    const pi = await stripe(`payment_intents/${piId}`);
    (pi.status === "succeeded" ? ok : ko)(`PaymentIntent ${pi.id} = ${pi.status} (${pi.amount} ${pi.currency})`);
    info(`pour rembourser : node scripts/stripe-smoke-test.mjs refund ${pi.id} --yes`);
  } else ko("pas de PaymentIntent rattaché");

  // Webhook : l'événement a-t-il été livré sans rester en attente ?
  const events = await stripe("events?type=checkout.session.completed&limit=20");
  const ev = events.data.find((e) => e.data?.object?.id === s.id);
  if (!ev) info("événement checkout.session.completed pas (encore) visible");
  else (ev.pending_webhooks === 0 ? ok : ko)(`webhook livré (pending_webhooks=${ev.pending_webhooks})`);

  // DB : ligne payments + crédits
  const pay = await supa("payments", `stripe_session_id=eq.${s.id}&select=kind,status,amount_cents,user_id`);
  if (pay === null) info("vérif DB ignorée (Supabase non configuré dans .env.local)");
  else if (pay.length && pay[0].status === "paid") {
    ok(`DB payments: ${pay[0].kind} ${pay[0].status} ${pay[0].amount_cents}c`);
    const led = await supa("credit_ledger", `payment_id=not.is.null&user_id=eq.${pay[0].user_id}&order=created_at.desc&limit=1&select=delta,reason`);
    if (led?.length) ok(`DB crédits: +${led[0].delta} (${led[0].reason})`);
  } else ko("aucune ligne payments 'paid' pour cette session (webhook non reçu ?)");
}

// ---------------------------------------------------------------------------
async function cmdVerifySub() {
  console.log("\n=== VÉRIF DERNIER ABONNEMENT ===");
  const subs = await stripe("subscriptions?limit=5&status=all");
  if (!subs.data.length) { ko("aucun abonnement — souscris sur /dashboard/credits d'abord"); return; }
  const sub = subs.data[0];
  info(`subscription ${sub.id}`);
  const it = sub.items.data[0];
  (["active", "trialing"].includes(sub.status) ? ok : ko)(`status=${sub.status} — ${it.price.unit_amount} ${it.price.currency}/${it.price.recurring.interval}`);
  sub.metadata?.user_id ? ok(`metadata.user_id présent (rattachement DB)`) : info("pas de metadata.user_id (rattachement par customer)");

  const db = await supa("subscriptions", `stripe_subscription_id=eq.${sub.id}&select=status,user_id,current_period_end`);
  if (db === null) info("vérif DB ignorée (Supabase non configuré)");
  else if (db.length) ok(`DB subscriptions: ${db[0].status} (fin période ${db[0].current_period_end ?? "n/c"})`);
  else ko("aucune ligne subscriptions en DB (webhook syncSubscription non reçu ?)");
  info(`pour annuler (fin de période) : node scripts/stripe-smoke-test.mjs cancel-sub ${sub.id} --yes`);
}

// ---------------------------------------------------------------------------
async function cmdRefund(piId, confirmed) {
  if (!piId?.startsWith("pi_")) { console.error("Usage: refund <pi_...> --yes"); process.exit(1); }
  const pi = await stripe(`payment_intents/${piId}`);
  console.log(`\nRemboursement de ${pi.id} : ${pi.amount} ${pi.currency} (status ${pi.status})`);
  if (!confirmed) { console.log("→ ajoute --yes pour confirmer. Rien fait."); return; }
  const r = await stripe("refunds", { method: "POST", body: { payment_intent: piId } });
  console.log(`✅ Remboursement ${r.id} = ${r.status} (${r.amount} ${r.currency})`);
}

async function cmdCancelSub(subId, confirmed) {
  if (!subId?.startsWith("sub_")) { console.error("Usage: cancel-sub <sub_...> --yes"); process.exit(1); }
  const sub = await stripe(`subscriptions/${subId}`);
  console.log(`\nAnnulation de ${sub.id} (status ${sub.status}) — en FIN de période (accès conservé jusqu'au terme).`);
  if (!confirmed) { console.log("→ ajoute --yes pour confirmer. Rien fait."); return; }
  const r = await stripe(`subscriptions/${subId}`, { method: "POST", body: { cancel_at_period_end: "true" } });
  console.log(`✅ ${r.id} : cancel_at_period_end=${r.cancel_at_period_end}`);
}

// ---------------------------------------------------------------------------
const [cmd, arg] = process.argv.slice(2);
const yes = process.argv.includes("--yes");
try {
  if (cmd === "config") await cmdConfig();
  else if (cmd === "verify-pack") await cmdVerifyPack();
  else if (cmd === "verify-sub") await cmdVerifySub();
  else if (cmd === "refund") await cmdRefund(arg, yes);
  else if (cmd === "cancel-sub") await cmdCancelSub(arg, yes);
  else {
    console.log("Commandes : config | verify-pack | verify-sub | refund <pi> --yes | cancel-sub <sub> --yes");
  }
} catch (e) {
  console.error("❌", e.message);
  process.exit(1);
}
