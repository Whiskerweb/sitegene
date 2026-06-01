import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

/** Ouvre le portail de facturation Stripe (gérer / annuler l'abonnement). */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "Aucun client Stripe associé." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${origin}/dashboard/credits`,
  });

  return NextResponse.json({ url: session.url });
}
