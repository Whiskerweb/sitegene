/** Annule l'essai en cours (dépublie, aucune charge). Form POST depuis le bandeau. */
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { userOwnsSite } from "@/lib/onboarding";
import { cancelTrial } from "@/lib/trial";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), 303);

  const form = await request.formData().catch(() => null);
  const siteId = String(form?.get("siteId") ?? "");
  if (!siteId || !(await userOwnsSite(user.id, siteId))) {
    return new Response("Accès refusé.", { status: 403 });
  }
  await cancelTrial(siteId);
  return NextResponse.redirect(new URL("/dashboard?trialCanceled=1", request.url), 303);
}
