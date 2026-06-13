/**
 * Tarification Akyra — AUTORITÉ SERVEUR.
 * Le client n'envoie jamais un prix ni un nombre de crédits : il envoie un
 * identifiant de pack, et le serveur résout le prix ici.
 */

/** Abonnement « tout compris » : 14,99 €/mois. */
export const SUBSCRIPTION_PRICE_CENTS = 1499;

/** Abonnement annuel : 149 € (≈ 2 mois offerts vs mensuel). */
export const SUBSCRIPTION_ANNUAL_PRICE_CENTS = 14900;

/** Price récurrent Stripe MENSUEL (à créer dans le dashboard Stripe). */
export const STRIPE_SUBSCRIPTION_PRICE_ID = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;

/** Price récurrent Stripe ANNUEL (à créer dans le dashboard Stripe). */
export const STRIPE_SUBSCRIPTION_ANNUAL_PRICE_ID =
  process.env.STRIPE_SUBSCRIPTION_ANNUAL_PRICE_ID;

export type SubscriptionInterval = "month" | "year";

/** Résout le price Stripe selon la cadence demandée. */
export function subscriptionPriceId(
  interval: SubscriptionInterval,
): string | undefined {
  return interval === "year"
    ? STRIPE_SUBSCRIPTION_ANNUAL_PRICE_ID
    : STRIPE_SUBSCRIPTION_PRICE_ID;
}

/**
 * Allocation mensuelle stockée pour l'affichage uniquement.
 * L'abonnement est ILLIMITÉ : le gating se fait via hasActiveSubscription(),
 * pas via une recharge de crédits.
 */
export const SUBSCRIPTION_MONTHLY_ALLOWANCE = 9999;

export type CreditPack = {
  id: string;
  credits: number;
  priceCents: number;
  label: string;
  popular?: boolean;
};

/** Packs de crédits à l'unité (paiement Stripe ponctuel). */
export const CREDIT_PACKS: CreditPack[] = [
  { id: "pack_10", credits: 10, priceCents: 900, label: "Découverte" },
  { id: "pack_30", credits: 30, priceCents: 2400, label: "Populaire", popular: true },
  { id: "pack_100", credits: 100, priceCents: 6900, label: "Pro" },
];

export function getPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}

/** Prix formaté en euros (ex. « 9,99 € »). */
export function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}
