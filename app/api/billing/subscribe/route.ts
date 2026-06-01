import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { STRIPE_SUBSCRIPTION_PRICE_ID } from "@/lib/pricing";
import { ensureStripeCustomer } from "@/lib/subscription";

/** Crée une session Checkout d'abonnement (9,99 €/mois, « tout illimité »). */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  if (!STRIPE_SUBSCRIPTION_PRICE_ID) {
    return NextResponse.json(
      { error: "Abonnement non configuré (STRIPE_SUBSCRIPTION_PRICE_ID manquant)." },
      { status: 500 },
    );
  }

  const admin = createAdminClient();
  const customer = await ensureStripeCustomer(admin, { id: user.id, email: user.email });
  const origin = new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price: STRIPE_SUBSCRIPTION_PRICE_ID, quantity: 1 }],
    metadata: { user_id: user.id, kind: "subscription" },
    subscription_data: { metadata: { user_id: user.id } },
    allow_promotion_codes: true,
    success_url: `${origin}/dashboard/credits?sub=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/credits`,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Échec de création de la session." }, { status: 500 });
  }
  return NextResponse.json({ url: session.url });
}
