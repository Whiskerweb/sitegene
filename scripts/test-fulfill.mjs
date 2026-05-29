// Teste la création de session Stripe + fulfillPayment (idempotent), sans navigateur.
// node --import tsx --env-file=.env.local scripts/test-fulfill.mjs
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const TOKEN = "92610ff7044e40119a494b44ceab690c"; // site "Studio Vision"

// 1) Création d'une session Stripe (preuve clé + Checkout).
const { stripe, LAUNCH_PRICE_CENTS } = await import(join(ROOT, "lib/stripe.ts"));
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [
    {
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: LAUNCH_PRICE_CENTS,
        product_data: { name: "Mise en ligne — Sitegene (test)" },
      },
    },
  ],
  metadata: { token: TOKEN },
  success_url: "http://localhost:3000/welcome?session_id={CHECKOUT_SESSION_ID}",
  cancel_url: "http://localhost:3000/r/" + TOKEN,
});
console.log("Stripe session:", session.id);
console.log("  url ok:", session.url ? "oui" : "non");
console.log("  payment_method_types:", JSON.stringify(session.payment_method_types));

// 2) fulfillPayment sur une session simulée payée (×2 → idempotence).
const { fulfillPayment } = await import(join(ROOT, "lib/fulfill.ts"));
const fake = {
  id: "cs_test_sim_" + Date.now(),
  metadata: { token: TOKEN },
  customer_details: { email: "photo.test@exemple.fr" },
  customer_email: null,
  payment_status: "paid",
  amount_total: 5000,
  currency: "eur",
  payment_intent: "pi_sim",
};
const r1 = await fulfillPayment(fake);
const r2 = await fulfillPayment(fake);
console.log("fulfill #1:", JSON.stringify(r1));
console.log("fulfill #2 (doit être idempotent):", JSON.stringify(r2));
import { writeFileSync } from "node:fs";
writeFileSync("/tmp/sg_fulfill.txt", `${fake.id}\n${r1.userId}\n${r1.siteId}`);
