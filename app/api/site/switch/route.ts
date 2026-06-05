import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Bascule le site actif du client.
 *  - Marque tous les autres sites is_active=false.
 *  - Marque le site cible is_active=true.
 *  - Si sync=true : copie le contenu du site source vers le site cible
 *    (best-effort : le contenu est copié tel quel ; les champs qui n'existent
 *    pas dans le template cible sont ignorés au rendu).
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const targetSiteId: string = body?.targetSiteId ?? "";
  const sync: boolean = body?.sync === true;
  if (!targetSiteId) return NextResponse.json({ error: "targetSiteId requis." }, { status: 400 });

  const admin = createAdminClient();

  // Vérifier que le site cible appartient bien à l'utilisateur.
  const { data: target } = await admin
    .from("sites")
    .select("id, owner_user_id, template_id")
    .eq("id", targetSiteId)
    .maybeSingle();
  if (!target || target.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Site introuvable." }, { status: 404 });
  }

  // Trouver le site actuellement actif (pour la sync éventuelle + héritage billing).
  const { data: allSites } = await admin
    .from("sites")
    .select("id, is_active, billing_status, status, slug")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false });

  const currentActive =
    (allSites ?? []).find((s) => s.is_active === true && s.id !== targetSiteId) ??
    (allSites ?? []).find((s) => s.id !== targetSiteId) ??
    null;
  const currentActiveId = currentActive?.id ?? null;

  // Sync optionnelle : copier le dernier contenu du site source vers la cible.
  if (sync && currentActiveId) {
    const { data: sourceContent } = await admin
      .from("site_content")
      .select("content_json, version")
      .eq("site_id", currentActiveId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sourceContent?.content_json) {
      // Récupère la version actuelle de la cible pour incrémenter.
      const { data: targetContent } = await admin
        .from("site_content")
        .select("version")
        .eq("site_id", targetSiteId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      const newVersion = (targetContent?.version ?? 0) + 1;

      await admin.from("site_content").insert({
        site_id: targetSiteId,
        version: newVersion,
        content_json: sourceContent.content_json,
        is_published: false,
      });
    }
  }

  // Désactiver tous les sites sauf la cible, activer la cible.
  await admin.from("sites").update({ is_active: false }).eq("owner_user_id", user.id).neq("id", targetSiteId);

  // Le site cible hérite du billing_status + status du site source :
  // l'abonnement est au niveau compte, pas au niveau site.
  // Sans ça, le garde-fou éditeur bloquerait l'accès au nouveau site.
  const billingInherit: Record<string, unknown> = { is_active: true };
  if (currentActive && currentActive.billing_status) {
    billingInherit.billing_status = currentActive.billing_status;
  }
  if (currentActive && currentActive.status && currentActive.status !== "draft") {
    billingInherit.status = currentActive.status;
  }
  await admin.from("sites").update(billingInherit).eq("id", targetSiteId);

  return NextResponse.json({ ok: true });
}
