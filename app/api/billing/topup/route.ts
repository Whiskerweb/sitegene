import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { getPack } from "@/lib/pricing";
import { ensureStripeCustomer } from "@/lib/subscription";

/** Crée une session Checkout ponctuelle pour un pack de crédits. */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const pack = getPack(body?.packId);
  if (!pack) return NextResponse.json({ error: "Pack inconnu." }, { status: 400 });

  const admin = createAdminClient();
  const customer = await ensureStripeCustomer(admin, { id: user.id, email: user.email });
  const origin = new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: pack.priceCents,
          product_data: {
            name: `${pack.credits} crédits Akyra`,
            description: `Pack ${pack.label} — ${pack.credits} modifications.`,
          },
        },
      },
    ],
    metadata: { user_id: user.id, kind: "topup", credits: String(pack.credits) },
    success_url: `${origin}/dashboard/credits?topup=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/credits`,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Échec de création de la session." }, { status: 500 });
  }
  return NextResponse.json({ url: session.url });
}
