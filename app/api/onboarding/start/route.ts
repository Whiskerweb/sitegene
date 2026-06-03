/**
 * Démarre (ou reprend) le parcours d'onboarding self-serve du client connecté.
 * Le compte existe déjà (gate sur la landing) : le site lui appartient dès ici.
 */
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { ensureOnboardingSite } from "@/lib/onboarding";
import { getCategory, DEFAULT_CATEGORY } from "@/lib/categories";

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
  const categoryId = (getCategory(String(body.categoryId ?? "")) ?? DEFAULT_CATEGORY).id;

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
    const message = e instanceof Error ? e.message : "Démarrage impossible.";
    console.error("[onboarding/start]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
