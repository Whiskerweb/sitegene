"use client";

import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import RevealWords from "./RevealWords";

const faqs = [
  {
    q: "Je n'y connais rien en technique, c'est grave ?",
    a: "Pas du tout. Le site est déjà construit. Vous déposez vos photos, vous le nommez, c'est en ligne. Aucun code, aucun réglage compliqué.",
  },
  {
    q: "C'est vraiment 50 € une seule fois ?",
    a: "Oui. 50 € pour lancer votre site, à renouveler une fois par an comme un nom de domaine. Pas d'abonnement obligatoire.",
  },
  {
    q: "Et mes photos ?",
    a: "On part de vos vraies photos pour habiller le design, et on les place au bon endroit. Vous gardez la main : on les remplace ou réordonne quand vous voulez.",
  },
  {
    q: "Je peux changer mon site après ?",
    a: "Oui. Vous demandez une modification depuis votre espace, on l'applique et on republie. C'est à ça que servent les crédits (on vous en offre au départ).",
  },
  {
    q: "Je peux mettre mon propre nom de domaine ?",
    a: "Au lancement votre site vit sur vous.sitegene.com. Vous pourrez brancher votre domaine ensuite, en quelques clics.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="px-6 py-24">
      <div className="mx-auto max-w-[820px]">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">FAQ</p>
        <RevealWords
          text="Vos questions, nos réponses."
          accent={[2]}
          className="max-w-[20ch] text-balance font-display text-[30px] font-medium leading-[1.08] tracking-[-0.01em] text-ink md:text-[48px]"
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
              className="group rounded-[18px] border border-line bg-card px-6 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 py-5 text-[17px] font-medium text-ink">
                {f.q}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-lg text-ink-soft transition-all duration-300 group-open:rotate-45 group-open:border-terracotta group-open:text-terracotta">
                  +
                </span>
              </summary>
              <p className="pb-6 pr-10 text-[15px] leading-[1.65] text-ink-soft">{f.a}</p>
            </motion.details>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
