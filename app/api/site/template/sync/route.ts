import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { primarySiteForUser } from "@/lib/primary-site";
import { isTemplateId } from "@/lib/templates";
import { ownsItem } from "@/lib/marketplace-server";
import { remapContentForTemplate } from "@/lib/template-apply";
import { loadEditableSnapshot, saveDraftSnapshot } from "@/lib/site-content-store";
import type { Intake } from "@/lib/onboarding-config";

export const maxDuration = 60;

/**
 * Synchronise le contenu de la peau COURANTE vers la peau `templateId` :
 * l'IA réadapte textes + photos sur la nouvelle maquette, puis on active la
 * peau cible. Retourne un rapport (transcrit / non placé / section vide).
 * Écrase l'instantané existant de la peau cible (action volontaire).
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const templateId = typeof body?.templateId === "string" ? body.templateId : "";
  if (!isTemplateId(templateId)) {
    return NextResponse.json({ error: "Template inconnu." }, { status: 400 });
  }

  const admin = createAdminClient();
  const site = await primarySiteForUser<{ id: string; template_id: string | null }>(
    admin,
    user.id,
    "id, template_id",
  );
  if (!site) return NextResponse.json({ error: "Aucun site." }, { status: 404 });
  if (templateId === site.template_id) {
    return NextResponse.json({ error: "Cette peau est déjà active." }, { status: 409 });
  }

  const owned =
    (await loadEditableSnapshot(admin, site.id, templateId)) != null ||
    (await ownsItem(admin, user.id, "template", templateId));
  if (!owned) return NextResponse.json({ error: "Template non débloqué." }, { status: 403 });

  // Contenu source = peau actuellement éditée.
  const source = site.template_id
    ? await loadEditableSnapshot(admin, site.id, site.template_id)
    : null;
  const sourceContent = (source?.content_json ?? {}) as Record<string, unknown>;

  // Intake d'onboarding comme base (faits du client prioritaires).
  const { data: ob } = await admin
    .from("site_onboarding")
    .select("intake")
    .eq("site_id", site.id)
    .maybeSingle();
  const baseIntake = (ob?.intake ?? {}) as Intake & { categoryId?: string };

  const origin = new URL(request.url).origin;
  const remap = await remapContentForTemplate(
    origin,
    sourceContent,
    site.template_id,
    templateId,
    baseIntake,
  );
  if (!remap) return NextResponse.json({ error: "Template indisponible." }, { status: 500 });

  // Persiste le contenu synchronisé comme instantané de la peau cible + active.
  await saveDraftSnapshot(admin, site.id, templateId, remap.content, "ai");
  await admin.from("sites").update({ template_id: templateId }).eq("id", site.id);

  return NextResponse.json({ ok: true, templateId, report: remap.report });
}
