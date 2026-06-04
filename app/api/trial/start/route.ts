/**
 * Démarre l'essai 3 jours : Checkout Stripe `mode=setup` (enregistre la carte,
 * 0 € débité aujourd'hui). Form POST (redirect plein écran, pas de fetch).
 */
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { userOwnsSite } from "@/lib/onboarding";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), 303);

  const form = await request.formData().catch(() => null);
  const siteId = String(form?.get("siteId") ?? "");
  if (!siteId || !(await userOwnsSite(user.id, siteId))) {
    return new Response("Accès refusé.", { status: 403 });
  }

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("billing_status")
    .eq("id", siteId)
    .maybeSingle();
  // Déjà en essai ou payé → rien à faire.
  if (site?.billing_status === "trialing" || site?.billing_status === "paid") {
    return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  }

  // Customer Stripe (réutilisé s'il existe — colonne posée par le flux topup).
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .maybeSingle();
  let customerId = (profile?.stripe_customer_id as string) ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? (profile?.email as string) ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const origin = new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    payment_method_types: ["card"],
    metadata: { flow: "trial_50", site_id: siteId, user_id: user.id },
    success_url: `${origin}/welcome/trial?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard`,
  });
  if (!session.url) return new Response("Échec de création du paiement.", { status: 500 });
  return NextResponse.redirect(session.url, 303);
}
