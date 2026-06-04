/**
 * Essai gratuit 3 jours : la carte est enregistrée (Checkout mode=setup, 0 €),
 * le site est publié immédiatement, et le débit de 50 € a lieu à J+3
 * (worker scripts/trial-worker.mjs, PaymentIntent off-session).
 *
 * Idempotence du fulfillment : clé = stripe_session_id dans payments
 * (ligne `trial_50` créée `pending` ici, passée `paid` par le worker).
 */
import type Stripe from "stripe";
import { stripe, SIGNUP_CREDITS } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantCredits } from "@/lib/credits-server";
import { goLive, slugBaseForSite } from "@/lib/fulfill";

export const TRIAL_DAYS = 3;

/**
 * Effets durables d'un Checkout setup réussi — IDEMPOTENT.
 * Appelé depuis /welcome/trial (immédiat) ET le webhook (filet de sécurité).
 */
export async function fulfillTrialStart(session: Stripe.Checkout.Session): Promise<{
  siteId: string | null;
  slug: string | null;
}> {
  const admin = createAdminClient();
  const siteId = (session.metadata?.site_id as string) || null;
  const userId = (session.metadata?.user_id as string) || null;
  if (!siteId || !userId) return { siteId: null, slug: null };

  // Idempotence : la session a déjà été traitée → ne rien refaire.
  const { data: existing } = await admin
    .from("payments")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (existing) {
    const { data: site } = await admin.from("sites").select("slug").eq("id", siteId).maybeSingle();
    return { siteId, slug: (site?.slug as string) ?? null };
  }

  // Carte enregistrée : setup_intent → payment_method + customer.
  // GARDE-FOU PAIEMENT : sans carte enregistrée, on n'engage RIEN (pas de
  // publication, pas de trace de paiement) — le site reste draft/non payé.
  const setupIntentId =
    typeof session.setup_intent === "string" ? session.setup_intent : session.setup_intent?.id;
  if (!setupIntentId) return { siteId, slug: null };
  const si = await stripe.setupIntents.retrieve(setupIntentId);
  const paymentMethodId =
    typeof si.payment_method === "string" ? si.payment_method : si.payment_method?.id;
  const customerId = typeof si.customer === "string" ? si.customer : si.customer?.id;
  if (!paymentMethodId || !customerId) return { siteId, slug: null };

  await admin
    .from("profiles")
    .update({ stripe_customer_id: customerId, stripe_payment_method_id: paymentMethodId })
    .eq("id", userId);

  // Trace de paiement en attente (le worker la passera `paid` à J+3).
  // L'insertion est aussi le verrou d'idempotence (stripe_session_id UNIQUE) :
  // toute exécution concurrente échoue ici, jamais de double publication.
  const { error: payErr } = await admin.from("payments").insert({
    user_id: userId,
    stripe_session_id: session.id,
    amount_cents: 5000,
    currency: "eur",
    kind: "trial_50",
    status: "pending",
  });
  if (payErr) {
    // Collision sur la clé unique → une autre exécution a déjà fulfillé.
    const { data: site } = await admin.from("sites").select("slug").eq("id", siteId).maybeSingle();
    return { siteId, slug: (site?.slug as string) ?? null };
  }

  // Crédits de bienvenue : le client peut faire ses premières modifs pendant l'essai.
  await grantCredits(admin, userId, SIGNUP_CREDITS, "signup_grant", {});

  // Publication immédiate + démarrage de l'essai.
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 3600 * 1000).toISOString();
  const base = await slugBaseForSite(admin, siteId, null);
  const slug = await goLive(admin, siteId, base);
  await admin
    .from("sites")
    .update({ billing_status: "trialing", trial_ends_at: trialEndsAt, trial_charge_attempts: 0 })
    .eq("id", siteId);

  // Côté prospection : ce prospect est converti (stoppe les relances).
  const { data: code } = await admin
    .from("prospect_codes")
    .select("id, prospect_id")
    .eq("site_id", siteId)
    .maybeSingle();
  if (code?.id) {
    await admin.from("prospect_codes").update({ status: "paid" }).eq("id", code.id);
    if (code.prospect_id) {
      await admin
        .from("outreach")
        .update({ status: "converted", updated_at: new Date().toISOString() })
        .eq("prospect_id", code.prospect_id);
    }
  }

  // Trace analytics — best-effort. La contrainte events.type est étendue par la
  // migration 0017 pour inclure 'trial_started'. On ne laisse JAMAIS une erreur
  // d'event casser le fulfillment.
  try {
    await admin.from("events").insert({ token: null, site_id: siteId, type: "trial_started" });
  } catch (e) {
    console.error("[trial] event insert failed:", e instanceof Error ? e.message : e);
  }

  return { siteId, slug };
}

/** Annulation pendant l'essai : dépublie le site, aucune charge. */
export async function cancelTrial(siteId: string): Promise<void> {
  const admin = createAdminClient();
  // Bascule UNIQUEMENT depuis 'trialing' : un site déjà `paid` ne peut pas être
  // dépublié par cette route (la garde .eq('billing_status','trialing') le protège).
  const { data: updated } = await admin
    .from("sites")
    .update({ billing_status: "canceled", status: "draft" })
    .eq("id", siteId)
    .eq("billing_status", "trialing")
    .select("id");
  // Aucune ligne mise à jour → le site n'était pas en essai : ne rien dépublier.
  if (!updated || updated.length === 0) return;

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
