import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/** Prix de lancement (50 €, en centimes). */
export const LAUNCH_PRICE_CENTS = 5000;
/** Crédits offerts à l'inscription (premières modifs sans frais). */
export const SIGNUP_CREDITS = 10;
