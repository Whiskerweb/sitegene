import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantCredits } from "@/lib/credits-server";
import { SIGNUP_CREDITS } from "@/lib/stripe";

export type FulfillResult = {
  email: string | null;
  token: string | null;
  siteId: string | null;
  userId: string | null;
};

/** Trouve ou crée un utilisateur Supabase par email. */
async function ensureUser(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<string> {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (found) return found.id;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser: ${error?.message}`);
  return data.user.id;
}

/**
 * Effets durables d'un paiement réussi — IDEMPOTENT (clé = stripe_session_id).
 * Appelé depuis /welcome (immédiat) ET le webhook (filet de sécurité).
 */
export async function fulfillPayment(
  session: Stripe.Checkout.Session,
): Promise<FulfillResult> {
  const admin = createAdminClient();
  const token = (session.metadata?.token as string) || null;
  const email =
    session.customer_details?.email || (session.customer_email as string) || null;

  const { data: code } = token
    ? await admin
        .from("prospect_codes")
        .select("id, site_id, prospect_id")
        .eq("token", token)
        .maybeSingle()
    : { data: null };
  const siteId = code?.site_id ?? null;

  if (!email) return { email: null, token, siteId, userId: null };
  const userId = await ensureUser(admin, email);

  // Idempotence : si le paiement est déjà enregistré, ne rien refaire.
  const { data: existing } = await admin
    .from("payments")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (existing) return { email, token, siteId, userId };

  const { data: payment } = await admin
    .from("payments")
    .insert({
      user_id: userId,
      prospect_code_id: code?.id ?? null,
      stripe_session_id: session.id,
      stripe_payment_intent: (session.payment_intent as string) ?? null,
      amount_cents: session.amount_total ?? 5000,
      currency: session.currency ?? "eur",
      kind: "initial_50",
      status: "paid",
    })
    .select("id")
    .single();

  await grantCredits(admin, userId, SIGNUP_CREDITS, "signup_grant", {
    payment_id: payment?.id,
  });

  if (code?.id) {
    await admin.from("prospect_codes").update({ status: "paid" }).eq("id", code.id);
  }
  if (siteId) {
    await admin.from("sites").update({ owner_user_id: userId }).eq("id", siteId);
    await admin.from("events").insert({ token, site_id: siteId, type: "purchased" });
  }

  return { email, token, siteId, userId };
}
