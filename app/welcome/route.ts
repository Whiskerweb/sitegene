import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { fulfillPayment } from "@/lib/fulfill";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Retour de paiement Stripe : vérifie la session, applique les effets durables
 * (fulfillPayment, idempotent), AUTO-CONNECTE le prospect (sans OTP la 1re fois),
 * puis l'envoie nommer son site.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) return NextResponse.redirect(`${origin}/`);

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    const token = session.metadata?.token;
    return NextResponse.redirect(`${origin}/r/${token ?? ""}`);
  }

  const result = await fulfillPayment(session);

  // Self-serve : le client est déjà connecté et son site vient d'être mis en
  // ligne → direction le dashboard, pas de nommage ni d'auto-login.
  if (result.selfServe) {
    return NextResponse.redirect(`${origin}/dashboard?welcome=1`);
  }

  if (!result.email) return NextResponse.redirect(`${origin}/login`);

  // Auto-login : génère un token magic-link côté serveur et le consomme (pose la session).
  const admin = createAdminClient();
  const { data: link } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: result.email,
  });
  if (link?.properties?.hashed_token) {
    const supabase = await createClient();
    await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: link.properties.hashed_token,
    });
  }

  return NextResponse.redirect(
    `${origin}/welcome/name?token=${result.token ?? ""}`,
  );
}
