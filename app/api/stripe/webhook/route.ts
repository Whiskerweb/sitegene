import { stripe } from "@/lib/stripe";
import { fulfillPayment } from "@/lib/fulfill";
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
    if (event.type === "checkout.session.completed") {
      await fulfillPayment(event.data.object as Stripe.Checkout.Session);
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
