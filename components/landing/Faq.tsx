"use client";

import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import RevealWords from "./RevealWords";

const faqs = [
  {
    q: "C'est vraiment 30 secondes ?",
    a: "Oui. Votre site est déjà construit avant même que vous arriviez. Vous le nommez, vous validez, il est en ligne. Le chargement dure quelques secondes, pas plus.",
  },
  {
    q: "Je peux mettre mon nom de domaine ?",
    a: "Au lancement, votre site vit sur vous.sitegene.com. Vous pourrez connecter votre propre domaine ensuite, en quelques clics.",
  },
  {
    q: "Et mes photos ?",
    a: "On part de vos vraies photos pour habiller le design. Vous gardez la main : on les remplace ou on les réordonne quand vous voulez.",
  },
  {
    q: "Je peux changer de design après ?",
    a: "Oui. Vous pouvez passer d'un template à un autre, ou demander des ajustements. C'est ce que servent les crédits.",
  },
  {
    q: "C'est quoi les crédits ?",
    a: "Une façon simple de faire évoluer votre site sans repayer un site entier. Modifier un texte, changer des photos, ajouter une section : chaque évolution coûte quelques crédits. On vous en offre au départ.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="px-6 py-24">
      <div className="mx-auto max-w-[820px]">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.18em] accent">
          FAQ
        </p>
        <RevealWords
          text="Vos questions, nos réponses."
          accent={[2]}
          className="mx-auto max-w-[20ch] text-balance text-center font-display text-[30px] font-semibold leading-[1.06] tracking-[-0.02em] md:text-[48px]"
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-14 space-y-3"
        >
          {faqs.map((f) => (
            <motion.details
              key={f.q}
              variants={fadeUp}
              className="group rounded-[16px] border border-line bg-ink-700 px-6 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 py-5 text-[17px] font-medium text-paper">
                {f.q}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-lg text-muted transition-all duration-300 group-open:rotate-45 group-open:border-violet-500 group-open:text-violet-400">
                  +
                </span>
              </summary>
              <p className="pb-6 pr-10 text-[15px] leading-[1.6] text-muted">
                {f.a}
              </p>
            </motion.details>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
