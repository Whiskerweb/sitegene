/**
 * Ownership et achats marketplace (page Formules). SERVEUR/admin uniquement —
 * comme lib/credits-server : jamais appelé avec le client anon. L'idempotence
 * est garantie par unique(user_id, item_type, item_id) + INSERT AVANT débit
 * (une course retombe sur already_owned sans second débit).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { genLicenseCode, priceFor, type MarketplaceItemType } from "./marketplace";
import { getBalance, grantCredits } from "./credits-server";
import { getEffect, listEffects } from "./effects";
import type { EffectModule } from "./effects/types";
import { isTemplateId } from "./templates";

export interface OwnedItems {
  templates: Set<string>;
  effects: Set<string>;
}

/** Tous les items possédés par un compte. */
export async function ownedItems(
  admin: SupabaseClient,
  userId: string,
): Promise<OwnedItems> {
  const { data } = await admin
    .from("marketplace_items")
    .select("item_type, item_id")
    .eq("user_id", userId);
  const out: OwnedItems = { templates: new Set(), effects: new Set() };
  for (const row of data ?? []) {
    if (row.item_type === "template") out.templates.add(row.item_id);
    else if (row.item_type === "effect") out.effects.add(row.item_id);
  }
  return out;
}

export async function ownsItem(
  admin: SupabaseClient,
  userId: string,
  itemType: MarketplaceItemType,
  itemId: string,
): Promise<boolean> {
  const { data } = await admin
    .from("marketplace_items")
    .select("id")
    .eq("user_id", userId)
    .eq("item_type", itemType)
    .eq("item_id", itemId)
    .maybeSingle();
  return !!data;
}

/** Modules d'effets possédés (jointure ownership × catalogue du repo). */
export async function ownedEffectModules(
  admin: SupabaseClient,
  userId: string,
): Promise<EffectModule[]> {
  const owned = await ownedItems(admin, userId);
  return listEffects().filter((e) => owned.effects.has(e.id));
}

export type PurchaseResult =
  | { ok: true; licenseCode: string; balance: number; alreadyOwned?: boolean }
  | { ok: false; code: "unknown_item" }
  | { ok: false; code: "insufficient"; balance: number; needed: number };

/**
 * Achat d'un item en crédits. Tout le monde paie (y compris les abonnés
 * illimité — décision produit) : l'abonnement couvre les modifications,
 * pas les items de la boutique.
 */
export async function purchaseItem(
  admin: SupabaseClient,
  userId: string,
  itemType: MarketplaceItemType,
  itemId: string,
): Promise<PurchaseResult> {
  const valid =
    itemType === "template" ? isTemplateId(itemId) : !!getEffect(itemId);
  if (!valid) return { ok: false, code: "unknown_item" };

  const existing = await admin
    .from("marketplace_items")
    .select("license_code")
    .eq("user_id", userId)
    .eq("item_type", itemType)
    .eq("item_id", itemId)
    .maybeSingle();
  const balance = await getBalance(admin, userId);
  if (existing.data) {
    return { ok: true, licenseCode: existing.data.license_code, balance, alreadyOwned: true };
  }

  const price = priceFor(itemType);
  if (balance < price) {
    return { ok: false, code: "insufficient", balance, needed: price };
  }

  const licenseCode = genLicenseCode(itemType);
  const { error } = await admin.from("marketplace_items").insert({
    user_id: userId,
    item_type: itemType,
    item_id: itemId,
    license_code: licenseCode,
    credits_spent: price,
  });
  if (error) {
    // Course sur unique(user_id,item_type,item_id) → déjà possédé, pas de débit.
    const again = await admin
      .from("marketplace_items")
      .select("license_code")
      .eq("user_id", userId)
      .eq("item_type", itemType)
      .eq("item_id", itemId)
      .maybeSingle();
    if (again.data) {
      return { ok: true, licenseCode: again.data.license_code, balance, alreadyOwned: true };
    }
    throw new Error(`[marketplace] insert: ${error.message}`);
  }

  const newBalance = await grantCredits(admin, userId, -price, "item_purchase", {});
  return { ok: true, licenseCode, balance: newBalance };
}
