import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMarketplaceItemType } from "@/lib/marketplace";
import { purchaseItem } from "@/lib/marketplace-server";

/**
 * Achat d'un item de la page Formules en CRÉDITS (template 15 ✦, effet 5 ✦).
 * Le prix n'est JAMAIS lu du body (autorité serveur via lib/marketplace).
 * Idempotent : re-acheter un item possédé renvoie alreadyOwned sans débit.
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
    return NextResponse.json({
      ok: true,
      licenseCode: result.licenseCode,
      balance: result.balance,
      alreadyOwned: result.alreadyOwned ?? false,
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
