"use client";

import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import RevealWords from "./RevealWords";

const chips = ["✓ 50 € une fois", "✓ sans code", "✓ vos vraies photos"];

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden px-6 pt-36 pb-20 md:pt-44 md:pb-28">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Colonne texte (alignée à gauche, éditoriale) */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft"
          >
            Sites pour photographes
          </motion.p>

          <RevealWords
            as="h1"
            trigger="load"
            text="Votre site photo, déjà prêt. En ligne en 30 secondes."
            accent={[6, 7, 8, 9]}
            className="max-w-[15ch] text-balance font-display text-[44px] font-medium leading-[1.02] tracking-[-0.02em] text-ink md:text-[80px]"
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.55 }}
            className="mt-6 max-w-[34rem] text-[17px] leading-[1.65] text-ink-soft md:text-[18px]"
          >
            On a déjà construit votre site. Vous choisissez un design, vous
            déposez vos photos, on le met en ligne. Pas de page blanche, pas de
            code, pas d'abonnement.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.7 }}
            className="relative mt-8 flex flex-wrap items-center gap-4"
          >
            <a
              href="#templates"
              className="btn-terra rounded-full px-7 py-3.5 text-[15px] font-semibold text-paper transition-transform hover:scale-[1.03] active:scale-[0.97]"
            >
              Voir mon site en 30 s
            </a>
            <a href="#how" className="text-[15px] font-semibold text-ink underline decoration-terracotta/40 underline-offset-4 hover:decoration-terracotta">
              Comment ça marche
            </a>
            <span className="font-hand text-[20px] text-terracotta">oui, vraiment 30 secondes ✦</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.9 }}
            className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft"
          >
            {chips.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </motion.div>
        </div>

        {/* Colonne visuelle : un vrai site posé comme un tirage */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
          className="relative"
        >
          <div className="card-print overflow-hidden rounded-[40px] border border-line">
            <div className="flex h-8 items-center gap-1.5 border-b border-line bg-paper-2 px-4">
              <span className="h-2 w-2 rounded-full bg-ink/15" />
              <span className="h-2 w-2 rounded-full bg-ink/15" />
              <span className="h-2 w-2 rounded-full bg-ink/15" />
            </div>
            <div className="relative aspect-[4/5] overflow-hidden">
              <iframe
                src="/_templates/alice-r/index.html"
                title="Exemple de site photographe"
                loading="lazy"
                tabIndex={-1}
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 origin-top-left"
                style={{ width: 1400, height: 1750, transform: "scale(0.42)" }}
              />
            </div>
          </div>
          <div className="absolute -left-4 bottom-10 flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-[13px] font-medium text-ink shadow-[0_14px_30px_-14px_rgba(28,26,23,0.3)]">
            <span className="dot-live h-2.5 w-2.5 rounded-full bg-sage" />
            Mis en ligne il y a 12 min
          </div>
        </motion.div>
      </div>
    </section>
  );
}
