import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBalance, grantCredits } from "@/lib/credits-server";
import { hasActiveSubscription } from "@/lib/subscription";

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
    .select("id, owner_user_id, status")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || site.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Site non autorisé." }, { status: 403 });
  }

  const { data: top } = await admin
    .from("site_content")
    .select("id, version, is_published")
    .eq("site_id", siteId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!top) return NextResponse.json({ error: "Contenu introuvable." }, { status: 404 });
  if (top.is_published) {
    return NextResponse.json({ ok: true, nothingToPublish: true });
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

  // 1) Publier le brouillon (les routes /s/ servent la plus haute version publiée).
  const { error: pubErr } = await admin
    .from("site_content")
    .update({ is_published: true })
    .eq("id", top.id);
  if (pubErr) return NextResponse.json({ error: pubErr.message }, { status: 400 });

  // 2) Débiter EN DERNIER (jamais débiter sans avoir publié) — sauf abonné illimité.
  const newBalance = unlimited
    ? await getBalance(admin, user.id)
    : await grantCredits(admin, user.id, -PUBLISH_COST, "edit_publish", {});

  return NextResponse.json({ ok: true, version: top.version, balance: newBalance, unlimited });
}
