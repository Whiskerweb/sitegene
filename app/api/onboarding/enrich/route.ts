/**
 * Étape 2 de l'écran de construction : l'IA réécrit tous les textes du template
 * choisi à partir du brief + réponses (briefToOverrides). Appelée APRÈS
 * /api/onboarding/choose — le contenu déterministe est déjà persisté, donc un
 * échec ici n'est jamais bloquant : le client continue avec un site propre.
 */
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { enrichFinalContent, userOwnsSite } from "@/lib/onboarding";

export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  let body: { siteId?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const siteId = String(body.siteId ?? "");
  if (!(await userOwnsSite(user.id, siteId))) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const origin = new URL(request.url).origin;
  const enriched = await enrichFinalContent(origin, siteId);
  return NextResponse.json({ ok: true, enriched });
}
