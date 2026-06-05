/**
 * Démarre (ou reprend) le parcours d'onboarding self-serve du client connecté.
 * Le compte existe déjà (gate sur la landing) : le site lui appartient dès ici.
 */
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { ensureOnboardingSite, AlreadyLiveError } from "@/lib/onboarding";
import { getCategory } from "@/lib/categories";

export const maxDuration = 30;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const origin = new URL(request.url).origin;
  let body: { brief?: string; categoryId?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* corps vide accepté (reprise) */
  }

  const brief = String(body.brief ?? "").trim();
  // [2.1] categoryId explicite uniquement si valide — sinon le serveur détecte
  // le métier depuis le brief (ensureOnboardingSite).
  const categoryId = getCategory(String(body.categoryId ?? ""))?.id;

  try {
    const state = await ensureOnboardingSite({
      origin,
      userId: user.id,
      email: user.email ?? null,
      brief,
      categoryId,
    });
    return NextResponse.json(state);
  } catch (e) {
    // Site déjà en ligne → retour au dashboard (pas un nouveau site fantôme).
    if (e instanceof AlreadyLiveError) {
      return NextResponse.json({ redirect: "/dashboard" });
    }
    const message = e instanceof Error ? e.message : "Démarrage impossible.";
    console.error("[onboarding/start]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
