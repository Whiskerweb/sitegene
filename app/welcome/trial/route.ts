/**
 * Retour du Checkout setup : applique fulfillTrialStart (idempotent — le
 * webhook est le filet de sécurité) puis renvoie au dashboard, site en ligne.
 */
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { fulfillTrialStart } from "@/lib/trial";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) return NextResponse.redirect(`${origin}/dashboard`);

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.mode === "setup" && session.status === "complete") {
    await fulfillTrialStart(session);
  }
  return NextResponse.redirect(`${origin}/dashboard?trial=1`);
}
