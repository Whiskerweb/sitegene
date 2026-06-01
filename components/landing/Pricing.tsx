"use client";

import { motion } from "framer-motion";
import { fadeUp, viewportOnce } from "@/lib/motion";
import RevealWords from "./RevealWords";
import { IconCheck } from "@/components/ui/icons";

const perks = [
  "Votre site en ligne sur vous.akyra.com",
  "Hébergement & adresse compris, rien à gérer",
  "Vos photos, votre nom, vos prestations",
  "Des crédits offerts pour le faire évoluer",
];

export default function Pricing() {
  return (
    <section id="tarif" className="relative overflow-hidden bg-surface-2 px-6 py-24">
      <div aria-hidden className="blob blob-blue absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2" />
      <div className="relative mx-auto max-w-[1240px]">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-brand">Tarif</p>
        <RevealWords
          text="Un prix. Pas de surprise."
          accent={[2, 3]}
          accentClass="text-brand"
          className="mx-auto max-w-[20ch] text-balance text-center font-display text-[30px] font-medium leading-[1.08] tracking-[-0.01em] text-night md:text-[48px]"
        />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="relative mx-auto mt-12 max-w-[480px]"
        >
          <div className="pop-in absolute -right-3 -top-3 z-10 rotate-3 rounded-2xl bg-gradient-to-br from-warn to-terracotta px-3 py-1.5 text-[13px] font-bold text-white shadow-[0_10px_24px_-8px_rgba(217,119,6,0.55)]">
            Tout compris
          </div>

          <div className="rounded-[28px] border border-sky-200 bg-white p-8 shadow-cloud md:p-10">
            <div className="flex items-end gap-2">
              <span className="font-display text-[64px] font-semibold leading-none tracking-[-0.02em] text-night">
                50€
              </span>
              <span className="mb-2 text-[15px] text-mist">/ an</span>
            </div>
            <p className="mt-3 text-[15px] leading-[1.6] text-slate">
              Tout compris : hébergement, mises à jour et votre adresse. Facturé
              une fois par an, comme un nom de domaine. Ça fait moins de 5&nbsp;€/mois.
            </p>

            <ul className="mt-7 space-y-3">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[15px]">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success-50 text-success">
                    <IconCheck size={13} />
                  </span>
                  <span className="text-night/90">{p}</span>
                </li>
              ))}
            </ul>

            <a
              href="#demo"
              className="btn-gold mt-8 block rounded-full px-7 py-4 text-center text-[15px] font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Lancer mon site · 50 €/an
            </a>
            <p className="mt-4 text-center font-hand text-[18px] text-brand">
              tout compris, moins de 5 €/mois ✦
            </p>
            <p className="mt-2 text-center text-[12.5px] text-mist">
              Des options avancées existent en abonnement, mais elles sont facultatives.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
