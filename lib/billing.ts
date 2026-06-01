import { stripe } from "@/lib/stripe";
import { fulfillTopup } from "@/lib/fulfill";
import { syncSubscription } from "@/lib/subscription";

/**
 * Réconcilie une session Checkout au retour de Stripe (filet de sécurité si le
 * webhook n'a pas encore tourné, ou n'est pas configuré). IDEMPOTENT — peut être
 * appelé à chaque rendu de la page sans double-créditer.
 *
 * On n'agit que si la session appartient bien à l'utilisateur courant.
 */
export async function reconcileBillingSession(
  sessionId: string,
  userId: string,
): Promise<void> {
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return; // session inconnue / id invalide → on ignore
  }

  if (session.metadata?.user_id !== userId) return;

  if (session.mode === "subscription" && session.subscription) {
    const sub = await stripe.subscriptions.retrieve(session.subscription as string);
    await syncSubscription(sub);
  } else if (session.payment_status === "paid" && session.metadata?.kind === "topup") {
    await fulfillTopup(session);
  }
}
