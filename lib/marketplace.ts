/**
 * Marketplace Akyra — AUTORITÉ SERVEUR.
 * Comme lib/pricing.ts : le client n'envoie jamais un prix, il envoie un
 * identifiant d'item et le serveur résout le prix ici. Les items s'achètent
 * en CRÉDITS (ledger), pas via Stripe — y compris pour les abonnés illimité.
 */
import { randomBytes } from "crypto";
import type { Rarity } from "@/lib/foundry/types";

/** Déblocage à vie d'un template (rebascule ensuite gratuite). */
export const TEMPLATE_PRICE_CREDITS = 15;

/** Licence d'un effet (intégration/repositionnement inclus, gratuit). */
export const EFFECT_PRICE_CREDITS = 5;

/**
 * Composants de section (fonderie), tarifés à la RARETÉ. Les communs sont
 * inclus dans tout site — seuls rare/epic s'achètent (déblocage à vie).
 */
export const COMPONENT_PRICE_CREDITS: Record<Rarity, number> = {
  common: 0,
  rare: 5,
  epic: 12,
};

export type MarketplaceItemType = "template" | "effect" | "component";

export function isMarketplaceItemType(x: string): x is MarketplaceItemType {
  return x === "template" || x === "effect" || x === "component";
}

/** Prix des items à tarif fixe (les composants se tarifent via componentPrice). */
export function priceFor(type: "template" | "effect"): number {
  return type === "template" ? TEMPLATE_PRICE_CREDITS : EFFECT_PRICE_CREDITS;
}

export function componentPrice(rarity: Rarity): number {
  return COMPONENT_PRICE_CREDITS[rarity];
}

/** Base32 sans caractères ambigus (pas de O/0/I/1). */
const LICENSE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const LICENSE_PREFIX: Record<MarketplaceItemType, string> = {
  template: "AKY-TPL",
  effect: "AKY-FX",
  component: "AKY-CMP",
};

/**
 * Code licence affiché au client (ex. AKY-FX-7K2M9). Identifiant d'achat
 * propre à chaque compte — pas une clé de sécurité (l'ownership fait foi).
 */
export function genLicenseCode(type: MarketplaceItemType): string {
  const bytes = randomBytes(5);
  let suffix = "";
  for (let i = 0; i < 5; i++) suffix += LICENSE_ALPHABET[bytes[i] % LICENSE_ALPHABET.length];
  return `${LICENSE_PREFIX[type]}-${suffix}`;
}
