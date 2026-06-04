/**
 * Le prospect (désormais connecté) revendique son site et fige sa template :
 * liaison owner_user_id + finalizeChoice (contenu final + enrichissement IA).
 * Garde-fou : un site déjà revendiqué par un AUTRE compte est refusé.
 */
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadStartState } from "@/lib/start-tunnel";
import { finalizeChoice } from "@/lib/onboarding";
import { isTemplateId, type TemplateId } from "@/lib/templates";

export const maxDuration = 60; // enrichissement IA de finalizeChoice

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  let body: { token?: string; templateId?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const token = String(body.token ?? "");
  const templateId = String(body.templateId ?? "");
  const state = token ? await loadStartState(token) : null;
  if (!state) {
    return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 404 });
  }
  if (state.ownerUserId && state.ownerUserId !== user.id) {
    return NextResponse.json(
      { error: "Ce site est déjà rattaché à un autre compte." },
      { status: 403 },
    );
  }
  if (!isTemplateId(templateId)) {
    return NextResponse.json({ error: "Modèle invalide." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!state.ownerUserId) {
    await admin.from("sites").update({ owner_user_id: user.id }).eq("id", state.siteId);
  }

  const origin = new URL(request.url).origin;
  const ok = await finalizeChoice(origin, state.siteId, templateId as TemplateId);
  if (!ok) {
    return NextResponse.json({ error: "Finalisation impossible." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, siteId: state.siteId });
}
