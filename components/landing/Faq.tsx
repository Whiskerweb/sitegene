"use client";

import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import RevealWords from "./RevealWords";

const faqs = [
  {
    q: "Je ne suis pas photographe, ça marche quand même ?",
    a: "Oui. Akyra s'adresse à tous les pros qui ont besoin d'un beau site vitrine. On démarre avec les photographes, et les musiciens et artisans arrivent très bientôt. Chaque métier a ses propres modèles, dessinés sur mesure.",
  },
  {
    q: "Je n'y connais rien en technique, c'est grave ?",
    a: "Pas du tout. Le site est déjà construit. Vous déposez vos photos, vous le nommez, c'est en ligne. Aucun code, aucun réglage compliqué.",
  },
  {
    q: "C'est 50 € par an, c'est tout ?",
    a: "Oui : 50 €/an pour votre site, tout compris (hébergement, mises à jour et votre adresse). Ça fait moins de 5 €/mois. Vous renouvelez une fois par an, comme un nom de domaine, et vous arrêtez quand vous voulez. Des options avancées comme les modifications illimitées existent en abonnement, mais vous n'êtes jamais obligé d'y souscrire. Aucun frais caché.",
  },
  {
    q: "Et mes photos ?",
    a: "On part de vos vraies photos pour habiller le design, et on les place au bon endroit. Vous gardez la main : on les remplace ou réordonne quand vous voulez.",
  },
  {
    q: "Je peux modifier mon site moi-même ?",
    a: "Oui, très simplement. Les textes et les photos se changent à la main, en cliquant dessus. Et pour tout ce qui touche à la mise en page, aux couleurs ou à la structure, vous le demandez à l'IA en une phrase : elle s'occupe du reste. Pas de code, jamais.",
  },
  {
    q: "Je peux mettre mon propre nom de domaine ?",
    a: "Au lancement votre site vit sur vous.akyra.com. Vous pourrez brancher votre domaine ensuite, en quelques clics.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-[820px]">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-brand">FAQ</p>
        <RevealWords
          text="Vos questions, nos réponses."
          accent={[2]}
          accentClass="text-brand"
          className="max-w-[20ch] text-balance font-display text-[30px] font-semibold leading-[1.08] tracking-[-0.01em] text-night md:text-[48px]"
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-12 space-y-3"
        >
          {faqs.map((f) => (
            <motion.details
              key={f.q}
              variants={fadeUp}
              className="group rounded-[18px] border border-black/[0.08] bg-surface-2 px-6 [&_summary::-webkit-details-marker]:hidden transition-all duration-300 hover:border-brand/20"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 py-5 text-[17px] font-medium text-night">
                {f.q}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-black/15 text-lg text-slate transition-all duration-300 group-open:rotate-45 group-open:border-brand group-open:text-brand">
                  +
                </span>
              </summary>
              <p className="pb-6 pr-10 text-[15px] leading-[1.65] text-slate">{f.a}</p>
            </motion.details>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
