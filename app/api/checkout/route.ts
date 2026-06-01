import { NextResponse } from "next/server";
import { stripe, LAUNCH_PRICE_CENTS } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/** Crée une session Stripe Checkout (Apple Pay/CB) depuis le reveal. */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const token = String(form?.get("token") ?? "");
  if (!token) {
    return new Response("Lien invalide.", { status: 400 });
  }

  const admin = createAdminClient();
  const { data: code } = await admin
    .from("prospect_codes")
    .select("site_id")
    .eq("token", token)
    .maybeSingle();
  if (!code) {
    return new Response("Lien invalide ou expiré.", { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: LAUNCH_PRICE_CENTS,
          product_data: {
            name: "Mise en ligne de votre site — Akyra",
            description: "Lancement de votre site professionnel.",
          },
        },
      },
    ],
    metadata: { token, site_id: code.site_id ?? "" },
    success_url: `${origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/r/${token}`,
  });

  if (!session.url) {
    return new Response("Échec de création du paiement.", { status: 500 });
  }
  return NextResponse.redirect(session.url, 303);
}
