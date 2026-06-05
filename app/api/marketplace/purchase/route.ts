import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMarketplaceItemType } from "@/lib/marketplace";
import { purchaseItem } from "@/lib/marketplace-server";
import { primarySiteForUser } from "@/lib/primary-site";
import { fetchDefaultContent } from "@/lib/site-server";
import { ensureSnapshot } from "@/lib/site-content-store";

/**
 * Achat d'un item de la page Formules en CRÉDITS (template 15 ✦, effet 5 ✦).
 * Le prix n'est JAMAIS lu du body (autorité serveur via lib/marketplace).
 * Idempotent : re-acheter un item possédé renvoie alreadyOwned sans débit.
 *
 * Quand un TEMPLATE est acheté : crée une PEAU (instantané de contenu par
 * défaut) sous le site unique du client — pas de nouveau site. La peau apparaît
 * dans la galerie et devient activable sans perte.
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
    // Achat d'un template → crée une PEAU (snapshot par défaut) sous le site unique.
    if (itemType === "template" && !result.alreadyOwned) {
      const site = await primarySiteForUser<{ id: string }>(admin, user.id, "id");
      if (site) {
        const origin = new URL(request.url).origin;
        const def = (await fetchDefaultContent(origin, itemId)) as Record<string, unknown> | null;
        await ensureSnapshot(admin, site.id, itemId, def ?? {});
      }
    }

    return NextResponse.json({
      ok: true,
      licenseCode: result.licenseCode,
      balance: result.balance,
      alreadyOwned: result.alreadyOwned ?? false,
      templateId: itemType === "template" ? itemId : null,
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
