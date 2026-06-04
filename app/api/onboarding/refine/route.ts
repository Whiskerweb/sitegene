/**
 * Boucle d'ajustement gratuite (avant paiement) : le client décrit ce qui ne
 * va pas sur son site fini, l'IA corrige uniquement les champs concernés
 * (feedbackToOverrides) et la nouvelle version est persistée — l'aperçu
 * /api/preview se recharge avec la correction. Plafonné par site (anti-abus).
 */
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { userOwnsSite } from "@/lib/onboarding";
import { fetchTemplateManifest } from "@/lib/site-server";
import { buildContent } from "@/lib/content-overlay";
import { feedbackToOverrides } from "@/lib/mistral";

export const maxDuration = 60;

/** Nombre maximal de retouches gratuites par site (ensuite : l'éditeur). */
const MAX_REFINES = 10;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  let body: { siteId?: string; prompt?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const siteId = String(body.siteId ?? "");
  const prompt = String(body.prompt ?? "").trim();
  if (prompt.length < 4 || prompt.length > 500) {
    return NextResponse.json(
      { error: "Décrivez le problème en quelques mots (4 à 500 caractères)." },
      { status: 400 },
    );
  }
  if (!(await userOwnsSite(user.id, siteId))) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: ob } = await admin
    .from("site_onboarding")
    .select("intake")
    .eq("site_id", siteId)
    .maybeSingle();
  const intake = (ob?.intake ?? {}) as Record<string, unknown>;
  const refineCount = typeof intake.refineCount === "number" ? intake.refineCount : 0;
  if (refineCount >= MAX_REFINES) {
    return NextResponse.json(
      { error: "Limite d'ajustements atteinte — le reste se peaufine dans l'éditeur, après la mise en ligne." },
      { status: 429 },
    );
  }

  const { data: site } = await admin
    .from("sites")
    .select("template_id")
    .eq("id", siteId)
    .maybeSingle();
  const { data: sc } = await admin
    .from("site_content")
    .select("id, content_json")
    .eq("site_id", siteId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const content = sc?.content_json as Record<string, unknown> | undefined;
  if (!site?.template_id || !sc || !content) {
    return NextResponse.json({ error: "Site introuvable." }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const manifest = await fetchTemplateManifest(origin, site.template_id);
  const overrides = await feedbackToOverrides({
    feedback: prompt,
    manifest,
    content,
    brief: typeof intake.brief === "string" ? intake.brief : undefined,
  });

  // Compte la tentative même sans correction (l'appel IA a eu lieu).
  await admin
    .from("site_onboarding")
    .update({
      intake: { ...intake, refineCount: refineCount + 1 },
      updated_at: new Date().toISOString(),
    })
    .eq("site_id", siteId);

  if (Object.keys(overrides).length === 0) {
    return NextResponse.json({
      ok: true,
      changed: 0,
      message:
        "Je n'ai pas pu traduire cette remarque en correction de texte — précisez l'endroit et ce que vous voulez lire à la place.",
    });
  }

  const next = buildContent(content, overrides, {});
  await admin.from("site_content").update({ content_json: next }).eq("id", sc.id);
  return NextResponse.json({ ok: true, changed: Object.keys(overrides).length });
}
