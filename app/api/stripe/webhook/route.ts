import { stripe } from "@/lib/stripe";
import { fulfillPayment, fulfillTopup } from "@/lib/fulfill";
import { fulfillTrialStart } from "@/lib/trial";
import { syncSubscription, setSubscriptionStatus } from "@/lib/subscription";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

/** Webhook Stripe : signature vérifiée + idempotent (webhook_events). */
export async function POST(request: Request) {
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();

  if (!sig || !secret) {
    return new Response("Webhook non configuré.", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "signature";
    return new Response(`Signature invalide: ${msg}`, { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotence : l'insertion échoue (PK) si l'event a déjà été traité.
  const { error: dupe } = await admin
    .from("webhook_events")
    .insert({ stripe_event_id: event.id, type: event.type });
  if (dupe) {
    return new Response("ok (déjà traité)", { status: 200 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode === "subscription" && s.subscription) {
          // Abonnement : on récupère l'objet complet (period_end au niveau item).
          const sub = await stripe.subscriptions.retrieve(s.subscription as string);
          await syncSubscription(sub);
        } else if (s.mode === "setup" && s.metadata?.flow === "trial_50") {
          // Essai 3 jours : carte enregistrée → publication immédiate (filet du
          // fulfillment fait à /welcome/trial ; idempotent par stripe_session_id).
          await fulfillTrialStart(s);
        } else if (s.metadata?.kind === "topup") {
          await fulfillTopup(s);
        } else if (s.mode === "setup") {
          // Session setup inconnue (pas de flow trial_50) : rien à honorer.
          console.warn("[webhook] setup session ignorée:", s.id);
        } else {
          // Flux historique : mise en ligne 50 €.
          await fulfillPayment(s);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        await setSubscriptionStatus(event.data.object as Stripe.Subscription, "canceled");
        break;
      }
      case "invoice.paid": {
        // Renouvellement : rafraîchit current_period_end.
        const inv = event.data.object as Stripe.Invoice;
        const ref = inv.parent?.subscription_details?.subscription;
        const subId = typeof ref === "string" ? ref : ref?.id;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await syncSubscription(sub);
        }
        break;
      }
      default:
        break;
    }
    await admin
      .from("webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erreur";
    return new Response(`Erreur traitement: ${msg}`, { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
