/**
 * Marketplace Akyra (page Formules) — AUTORITÉ SERVEUR.
 * Comme lib/pricing.ts : le client n'envoie jamais un prix, il envoie un
 * identifiant d'item et le serveur résout le prix ici. Les items s'achètent
 * en CRÉDITS (ledger), pas via Stripe — y compris pour les abonnés illimité.
 */
import { randomBytes } from "crypto";

/** Déblocage à vie d'un template (rebascule ensuite gratuite). */
export const TEMPLATE_PRICE_CREDITS = 15;

/** Licence d'un effet (intégration/repositionnement inclus, gratuit). */
export const EFFECT_PRICE_CREDITS = 5;

export type MarketplaceItemType = "template" | "effect";

export function isMarketplaceItemType(x: string): x is MarketplaceItemType {
  return x === "template" || x === "effect";
}

export function priceFor(type: MarketplaceItemType): number {
  return type === "template" ? TEMPLATE_PRICE_CREDITS : EFFECT_PRICE_CREDITS;
}

/** Base32 sans caractères ambigus (pas de O/0/I/1). */
const LICENSE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Code licence affiché au client (ex. AKY-FX-7K2M9). Identifiant d'achat
 * propre à chaque compte — pas une clé de sécurité (l'ownership fait foi).
 */
export function genLicenseCode(type: MarketplaceItemType): string {
  const prefix = type === "template" ? "AKY-TPL" : "AKY-FX";
  const bytes = randomBytes(5);
  let suffix = "";
  for (let i = 0; i < 5; i++) suffix += LICENSE_ALPHABET[bytes[i] % LICENSE_ALPHABET.length];
  return `${prefix}-${suffix}`;
}
