import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTemplateId } from "@/lib/templates";
import { ownsItem } from "@/lib/marketplace-server";
import { applyTemplateToSite } from "@/lib/template-apply";

/**
 * « Appliquer à mon site » (page Formules) : bascule GRATUITE du site du owner
 * vers un template possédé (acheté 15 ✦, ou template actuel). Le contenu est
 * reconstruit sur le template cible en préservant textes édités et photos —
 * voir lib/template-apply.
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
  const { data: site } = await admin
    .from("sites")
    .select("id, template_id, status")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!site) {
    return NextResponse.json({ error: "Aucun site." }, { status: 404 });
  }

  // Garde serveur : template débloqué (acheté) ou déjà celui du site.
  const owned =
    templateId === site.template_id ||
    (await ownsItem(admin, user.id, "template", templateId));
  if (!owned) {
    return NextResponse.json({ error: "Template non débloqué." }, { status: 403 });
  }

  const origin = new URL(request.url).origin;
  const result = await applyTemplateToSite(origin, site.id, templateId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, templateId: result.templateId, version: result.version });
}
