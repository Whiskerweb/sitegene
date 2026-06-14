import Stripe from "stripe";

/**
 * Client Stripe — instancié PARESSEUSEMENT. La clé n'est lue qu'au premier
 * accès réel (runtime), jamais au chargement du module : sinon la phase
 * « collect page data » du build Vercel évalue `new Stripe(undefined)` et
 * échoue quand STRIPE_SECRET_KEY n'est pas présent dans l'env de build
 * (ex. déploiement Preview où la clé est scopée Production). SERVEUR UNIQUEMENT.
 */
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY manquant — requis pour Stripe.");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

/** Proxy paresseux : `stripe.checkout.sessions…` marche sans instancier au build. */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const client = getStripe();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/** Prix de lancement (50 €, en centimes). */
export const LAUNCH_PRICE_CENTS = 5000;
/** Crédits offerts à l'inscription (premières modifs sans frais). */
export const SIGNUP_CREDITS = 10;
