import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMarketplaceItemType } from "@/lib/marketplace";
import { purchaseItem } from "@/lib/marketplace-server";
import { primarySiteForUser } from "@/lib/primary-site";

/**
 * Achat d'un item de la page Formules en CRÉDITS (template 15 ✦, effet 5 ✦).
 * Le prix n'est JAMAIS lu du body (autorité serveur via lib/marketplace).
 * Idempotent : re-acheter un item possédé renvoie alreadyOwned sans débit.
 *
 * Quand un TEMPLATE est acheté : crée automatiquement un site bibliothèque
 * (is_active=false) pour ce template, sauf si l'utilisateur en a déjà un.
 * Le site hérite du billing_status du site actif courant.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const itemType = typeof body?.itemType === "string" ? body.itemType : "";
  const itemId = typeof body?.itemId === "string" ? body.itemId : "";
  if (!isMarketplaceItemType(itemType) || !itemId) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const admin = createAdminClient();
  const result = await purchaseItem(admin, user.id, itemType, itemId);

  if (result.ok) {
    // Création automatique d'un site bibliothèque lors de l'achat d'un template.
    let newSiteId: string | null = null;
    if (itemType === "template" && !result.alreadyOwned) {
      // Vérifier si un site existe déjà pour ce template.
      const { data: existing } = await admin
        .from("sites")
        .select("id")
        .eq("owner_user_id", user.id)
        .eq("template_id", itemId)
        .limit(1)
        .maybeSingle();

      if (!existing) {
        // Récupérer le billing_status du site actif pour l'hériter.
        const activeSite = await primarySiteForUser<{
          id: string;
          billing_status: string | null;
          status: string;
        }>(admin, user.id, "id");

        const { data: newSite } = await admin
          .from("sites")
          .insert({
            owner_user_id: user.id,
            template_id: itemId,
            status: activeSite?.status ?? "draft",
            billing_status: activeSite?.billing_status ?? null,
            is_active: false,
          })
          .select("id")
          .single();

        newSiteId = newSite?.id ?? null;
      } else {
        newSiteId = existing.id;
      }
    }

    return NextResponse.json({
      ok: true,
      licenseCode: result.licenseCode,
      balance: result.balance,
      alreadyOwned: result.alreadyOwned ?? false,
      newSiteId,
    });
  }
  if (result.code === "insufficient") {
    return NextResponse.json(
      {
        error: "Solde insuffisant.",
        balance: result.balance,
        needed: result.needed,
      },
      { status: 409 },
    );
  }
  return NextResponse.json({ error: "Item inconnu." }, { status: 400 });
}
