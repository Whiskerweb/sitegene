/**
 * Le client choisit sa direction artistique (template) : fige IMMÉDIATEMENT le
 * contenu déterministe sur ce template (photos cyclées, faits client) — aucune
 * IA ici, la réponse doit être rapide et la persistance garantie. L'écran de
 * construction enchaîne ensuite sur /api/onboarding/enrich (réécriture IA,
 * best-effort). Renvoie le token (réutilisé par /api/checkout).
 */
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { finalizeChoice, loadOnboarding, userOwnsSite } from "@/lib/onboarding";
import { isTemplateId, type TemplateId } from "@/lib/templates";

export const maxDuration = 30;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const origin = new URL(request.url).origin;
  let body: { siteId?: string; templateId?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const siteId = String(body.siteId ?? "");
  const templateId = String(body.templateId ?? "");
  if (!(await userOwnsSite(user.id, siteId))) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  // Le client peut choisir N'IMPORTE QUEL template du catalogue (pas seulement
  // ceux de sa catégorie) : le mapping intake est piloté par le manifest de
  // chaque template, l'aperçu et le choix fonctionnent donc partout.
  const state = await loadOnboarding(user.id);
  if (!isTemplateId(templateId)) {
    return NextResponse.json({ error: "Modèle invalide." }, { status: 400 });
  }

  // Self-serve : pas d'IA inline (l'écran de construction appelle /enrich) et
  // jamais de photo de démo restante (placeholders neutres si 0 photo).
  const ok = await finalizeChoice(origin, siteId, templateId as TemplateId, {
    enrich: false,
    emptyPhotos: "placeholder",
  });
  if (!ok) {
    return NextResponse.json({ error: "Finalisation impossible." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, token: state?.token ?? null });
}
