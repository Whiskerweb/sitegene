"use client";

import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import RevealWords from "./RevealWords";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden px-6 pt-40 pb-24 md:pt-52 md:pb-32"
    >
      {/* Glow d'ambiance violet */}
      <div className="glow-violet pointer-events-none absolute inset-x-0 -top-20 h-[600px]" />

      <div className="relative mx-auto max-w-[1240px]">
        {/* Kicker or */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.18em] accent-gold"
        >
          Sites pour photographes
        </motion.p>

        {/* Titre clip-reveal */}
        <RevealWords
          as="h1"
          trigger="load"
          text="Votre site de photographe. En ligne en 30 secondes."
          accent={[6, 7, 8]}
          className="mx-auto max-w-[18ch] text-balance text-center font-display text-[40px] font-semibold leading-[1.02] tracking-[-0.03em] md:text-[72px]"
        />

        {/* Sous-titre */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.6 }}
          className="mx-auto mt-7 max-w-[34rem] text-pretty text-center text-[16px] leading-[1.55] text-muted md:text-[18px]"
        >
          Des sites pensés pour les photographes, déjà construits et déjà beaux.
          Vous choisissez, on publie. Pas de page blanche, pas de code.
        </motion.p>

        {/* CTA + annotation manuscrite */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.75 }}
          className="relative mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a
            href="#tarif"
            className="btn-violet w-full rounded-full px-7 py-3.5 text-center text-[15px] font-semibold text-white transition-transform hover:scale-[1.03] active:scale-[0.97] sm:w-auto"
          >
            Mettre mon site en ligne
          </a>
          <a
            href="#templates"
            className="glass w-full rounded-full px-7 py-3.5 text-center text-[15px] font-semibold text-paper transition-colors hover:bg-white/10 sm:w-auto"
          >
            Voir les templates
          </a>

          {/* Annotation Caveat + flèche */}
          <div className="pointer-events-none absolute -right-2 top-full hidden translate-y-2 lg:block">
            <span className="font-hand text-[20px] text-gold-400">
              en 30 secondes ⏱
            </span>
            <svg
              width="60"
              height="34"
              viewBox="0 0 60 34"
              fill="none"
              className="absolute -left-10 -top-1 -scale-x-100"
            >
              <path
                d="M2 4C18 2 44 6 56 26"
                stroke="#E8B468"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M48 24l9 3-4 8"
                stroke="#E8B468"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </motion.div>

        {/* Mini-preuve sociale */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.95 }}
          className="mt-12 flex items-center justify-center gap-2.5 text-sm text-faint"
        >
          <span className="relative grid h-2.5 w-2.5 place-items-center">
            <span className="dot-live h-2.5 w-2.5 rounded-full bg-mint-400" />
          </span>
          <span>124 sites de photographes en ligne ce mois-ci</span>
        </motion.div>
      </div>
    </section>
  );
}
