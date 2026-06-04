/**
 * Le client choisit sa direction artistique (template) au reveal multi-DA :
 * fige le contenu final sur ce template et passe au paywall. Renvoie le token
 * (réutilisé par /api/checkout). Garde-fou d'ownership + template candidat.
 */
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  candidateTemplates,
  finalizeChoice,
  loadOnboarding,
  userOwnsSite,
} from "@/lib/onboarding";
import { isTemplateId, type TemplateId } from "@/lib/templates";

/** Laisse le temps à l'enrichissement IA du contenu final (briefToOverrides). */
export const maxDuration = 60;

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

  const state = await loadOnboarding(user.id);
  const candidates = candidateTemplates(state?.categoryId ?? "photographe");
  if (!isTemplateId(templateId) || !candidates.includes(templateId as TemplateId)) {
    return NextResponse.json({ error: "Modèle invalide." }, { status: 400 });
  }

  const ok = await finalizeChoice(origin, siteId, templateId as TemplateId);
  if (!ok) {
    return NextResponse.json({ error: "Finalisation impossible." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, token: state?.token ?? null });
}
