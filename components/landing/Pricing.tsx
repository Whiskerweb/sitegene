"use client";

import { motion } from "framer-motion";
import { fadeUp, pop, viewportOnce } from "@/lib/motion";
import RevealWords from "./RevealWords";

const perks = [
  "Votre site, en ligne sur vous.sitegene.com",
  "Vos photos, votre nom, vos prestations",
  "Des crédits pour le faire évoluer quand vous voulez",
];

export default function Pricing() {
  return (
    <section id="tarif" className="relative px-6 py-24">
      <div className="glow-violet pointer-events-none absolute inset-x-0 top-10 h-[400px]" />
      <div className="relative mx-auto max-w-[1240px]">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.18em] accent">
          Tarif
        </p>
        <RevealWords
          text="Un prix. Pas de surprise."
          accent={[2, 3]}
          className="mx-auto max-w-[20ch] text-balance text-center font-display text-[30px] font-semibold leading-[1.06] tracking-[-0.02em] md:text-[48px]"
        />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="relative mx-auto mt-14 max-w-[460px]"
        >
          {/* Badge prix doré */}
          <motion.div
            variants={pop}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="absolute -right-3 -top-3 z-10 rotate-3 rounded-2xl bg-gold-400 px-3 py-1.5 text-[13px] font-bold text-ink-900 shadow-[0_10px_30px_-8px_rgba(232,180,104,0.6)]"
          >
            Lancement
          </motion.div>

          <div className="rounded-[24px] border border-line-strong bg-ink-700 p-8 md:p-10">
            <div className="flex items-end gap-2">
              <span className="font-display text-[56px] font-semibold leading-none tracking-[-0.02em]">
                50€
              </span>
              <span className="mb-2 text-[15px] text-faint">une fois</span>
            </div>
            <p className="mt-3 text-[15px] text-muted">
              Pour lancer votre site et le rendre joignable. Renouvelable une
              fois par an, comme votre nom de domaine.
            </p>

            <ul className="mt-7 space-y-3">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[15px]">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mint-400/15 text-xs text-mint-400">
                    ✓
                  </span>
                  <span className="text-paper/90">{p}</span>
                </li>
              ))}
            </ul>

            <a
              href="#top"
              className="btn-violet mt-8 block rounded-full px-7 py-4 text-center text-[15px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Lancer pour 50 €
            </a>
            <p className="mt-4 text-center text-[13px] text-faint">
              Envie de changer de design plus tard ? Des crédits, à la carte.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
