import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUBSCRIPTION_MONTHLY_ALLOWANCE } from "@/lib/pricing";

/**
 * Abonnement « tout illimité » actif ?
 * status active/trialing ET période en cours non expirée. SERVEUR/admin.
 */
export async function hasActiveSubscription(
  admin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  // Le STATUT est le signal principal (active/trialing). On n'applique la date
  // de fin de période que si elle est connue — sur l'API Stripe récente elle
  // peut arriver après coup, et on ne veut pas désactiver à tort un abo payé.
  const { data } = await admin
    .from("subscriptions")
    .select("current_period_end")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return false;
  if (data.current_period_end && new Date(data.current_period_end).getTime() <= Date.now()) {
    return false; // période expirée connue
  }
  return true;
}

/**
 * Récupère (ou crée) le customer Stripe de l'utilisateur et le persiste sur le
 * profil. Réutilisé pour le top-up ET l'abonnement.
 */
export async function ensureStripeCustomer(
  admin: SupabaseClient,
  user: { id: string; email?: string | null },
): Promise<string> {
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    metadata: { user_id: user.id },
  });
  await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", user.id);
  return customer.id;
}

/**
 * Upsert d'un abonnement Stripe dans la table subscriptions — IDEMPOTENT
 * (clé = stripe_subscription_id). Appelé par le webhook sur création / mise à
 * jour / renouvellement (invoice.paid).
 */
export async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const admin = createAdminClient();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  // Rattacher l'utilisateur : via metadata (posée à la souscription), sinon via le customer.
  let userId = (sub.metadata?.user_id as string | undefined) ?? null;
  if (!userId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    userId = profile?.id ?? null;
  }
  if (!userId) return; // impossible de rattacher → on ignore proprement

  // current_period_end : au niveau item sur l'API récente, sinon au niveau abo (legacy).
  const periodEnd =
    sub.items?.data?.[0]?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    null;

  await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: sub.id,
      status: sub.status,
      monthly_credit_allowance: SUBSCRIPTION_MONTHLY_ALLOWANCE,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    },
    { onConflict: "stripe_subscription_id" },
  );

  // Back-fill du customer id sur le profil s'il manque.
  await admin
    .from("profiles")
    .update({ stripe_customer_id: customerId })
    .eq("id", userId)
    .is("stripe_customer_id", null);
}

/** Passe un abonnement à un statut donné (ex. 'canceled') par son id Stripe. */
export async function setSubscriptionStatus(
  sub: Stripe.Subscription,
  status: string,
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("subscriptions")
    .update({ status })
    .eq("stripe_subscription_id", sub.id);
}
