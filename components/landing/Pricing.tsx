"use client";

import { motion } from "framer-motion";
import { fadeUp, viewportOnce } from "@/lib/motion";
import RevealWords from "./RevealWords";

const perks = [
  "Votre site en ligne sur vous.sitegene.com",
  "Vos photos, votre nom, vos prestations",
  "Des crédits offerts pour le faire évoluer",
  "Aucun abonnement obligatoire",
];

export default function Pricing() {
  return (
    <section id="tarif" className="px-6 py-24">
      <div className="mx-auto max-w-[1200px]">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Tarif</p>
        <RevealWords
          text="Un prix. Pas de surprise."
          accent={[2, 3]}
          className="max-w-[20ch] text-balance font-display text-[30px] font-medium leading-[1.08] tracking-[-0.01em] text-ink md:text-[48px]"
        />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="relative mx-auto mt-12 max-w-[480px]"
        >
          <div className="absolute -right-3 -top-3 z-10 rotate-3 rounded-2xl bg-terracotta px-3 py-1.5 text-[13px] font-bold text-paper shadow-[0_10px_24px_-8px_rgba(201,84,59,0.6)]">
            Paiement unique
          </div>

          <div className="card-print rounded-[28px] border border-line p-8 md:p-10">
            <div className="flex items-end gap-2">
              <span className="font-display text-[64px] font-semibold leading-none tracking-[-0.02em] text-ink">
                50€
              </span>
              <span className="mb-2 text-[15px] text-ink-faint">une fois</span>
            </div>
            <p className="mt-3 text-[15px] leading-[1.6] text-ink-soft">
              Pour lancer votre site et le rendre joignable. À renouveler une fois
              par an, comme votre nom de domaine.
            </p>

            <ul className="mt-7 space-y-3">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[15px]">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sage/15 text-xs text-sage">✓</span>
                  <span className="text-ink/90">{p}</span>
                </li>
              ))}
            </ul>

            <a
              href="#templates"
              className="btn-terra mt-8 block rounded-full px-7 py-4 text-center text-[15px] font-semibold text-paper transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Choisir mon design
            </a>
            <p className="mt-4 text-center font-hand text-[18px] text-terracotta">
              pas d'abonnement, promis ✦
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
