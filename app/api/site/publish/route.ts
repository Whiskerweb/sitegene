import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBalance, grantCredits } from "@/lib/credits-server";
import { hasActiveSubscription } from "@/lib/subscription";
import { validateContentV2 } from "@/lib/validate-content";
import { publishSnapshot } from "@/lib/site-content-store";

const PUBLISH_COST = 1;

/**
 * Publie le brouillon courant (le rend live) et débite 1 crédit. Idempotent :
 * si la dernière version est déjà publiée, ne fait rien et ne débite pas.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const siteId = body?.siteId;
  if (!siteId) return NextResponse.json({ error: "siteId requis." }, { status: 400 });

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, owner_user_id, status, template_id")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || site.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Site non autorisé." }, { status: 403 });
  }

  // Plus haute version de la PEAU courante (celle qu'on publie en ligne).
  const { data: top } = await admin
    .from("site_content")
    .select("id, version, is_published, content_json")
    .eq("site_id", siteId)
    .eq("template_id", site.template_id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!top) return NextResponse.json({ error: "Contenu introuvable." }, { status: 404 });
  if (top.is_published) {
    // La peau courante est déjà l'unique snapshot en ligne → rien à faire.
    return NextResponse.json({ ok: true, nothingToPublish: true });
  }

  // Valide le contenu v2 avant publication.
  const contentJson = top.content_json as Record<string, unknown> | null;
  if (contentJson?.version === 2) {
    const validation = validateContentV2(contentJson);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
  }

  // Abonné « tout illimité » : aucune vérif de solde ni débit.
  const unlimited = await hasActiveSubscription(admin, user.id);
  if (!unlimited) {
    const balance = await getBalance(admin, user.id);
    if (balance < PUBLISH_COST) {
      return NextResponse.json(
        { error: "Solde insuffisant. Achetez des crédits ou passez à l'illimité pour publier." },
        { status: 409 },
      );
    }
  }

  // 1) Publier la peau courante comme UNIQUE snapshot en ligne (dépublie les autres).
  await publishSnapshot(admin, siteId, site.template_id ?? "");

  // 2) Débiter EN DERNIER (jamais débiter sans avoir publié) — sauf abonné illimité.
  const newBalance = unlimited
    ? await getBalance(admin, user.id)
    : await grantCredits(admin, user.id, -PUBLISH_COST, "edit_publish", {});

  return NextResponse.json({ ok: true, version: top.version, balance: newBalance, unlimited });
}
