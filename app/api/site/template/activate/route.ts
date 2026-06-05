import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { primarySiteForUser } from "@/lib/primary-site";
import { isTemplateId } from "@/lib/templates";
import { ownsItem } from "@/lib/marketplace-server";
import { fetchDefaultContent } from "@/lib/site-server";
import { ensureSnapshot, loadEditableSnapshot } from "@/lib/site-content-store";
import { ensureTemplateRow } from "@/lib/generate";

/**
 * Active une peau (template) sur le site unique du propriétaire — SANS perte.
 * La peau garde son propre instantané de contenu : on bascule juste
 * `sites.template_id`. Si la peau n'a jamais été ouverte, on crée un
 * instantané initial à partir du contenu par défaut du template.
 * C'est instantané (aucun appel IA) — voir /sync pour la synchronisation.
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

  // Possession : peau courante, snapshot déjà existant, ou template acheté.
  const hasSnapshot = !!(await loadEditableSnapshot(admin, site.id, templateId));
  const owned =
    templateId === site.template_id ||
    hasSnapshot ||
    (await ownsItem(admin, user.id, "template", templateId));
  if (!owned) {
    return NextResponse.json({ error: "Template non débloqué." }, { status: 403 });
  }

  // Première ouverture de la peau → instantané depuis le contenu par défaut.
  if (!hasSnapshot) {
    const origin = new URL(request.url).origin;
    const def = (await fetchDefaultContent(origin, templateId)) as Record<string, unknown> | null;
    await ensureSnapshot(admin, site.id, templateId, def ?? {});
  }

  // sites.template_id a une FK vers templates(id) : garantir la ligne avant
  // l'activation (les templates achetés au marketplace n'y sont pas d'office).
  await ensureTemplateRow(admin, templateId);

  // Active la peau et vérifie que l'écriture a pris effet (sinon l'éditeur
  // rechargerait l'ancienne peau).
  const { data: activated, error: actErr } = await admin
    .from("sites")
    .update({ template_id: templateId })
    .eq("id", site.id)
    .select("template_id")
    .single();
  if (actErr || activated?.template_id !== templateId) {
    return NextResponse.json(
      { error: `Impossible d'activer le template (${actErr?.message ?? "non appliqué"}).` },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, templateId });
}
