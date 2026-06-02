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
    <section id="tarif" className="relative overflow-hidden bg-ink-800 border-b border-[var(--line)] px-6 py-24">
      {/* Glow d'ambiance violet doux */}
      <div aria-hidden className="blob blob-blue absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 opacity-30 blur-[100px]" />
      <div className="relative mx-auto max-w-[1240px]">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-violet-400">Tarif</p>
        <RevealWords
          text="Un prix. Pas de surprise."
          accent={[2, 3]}
          accentClass="text-violet-400"
          className="mx-auto max-w-[20ch] text-balance text-center font-display text-[30px] font-bold leading-[1.08] tracking-[-0.01em] text-paper md:text-[48px]"
        />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="relative mx-auto mt-12 max-w-[480px]"
        >
          {/* Badge prix doré flottant */}
          <div className="pop-in absolute -right-3 -top-3 z-10 rotate-3 rounded-2xl bg-gold-400 px-3.5 py-1.5 text-[13px] font-bold text-ink-900 shadow-[0_10px_24px_-8px_rgba(232,180,104,0.55)]">
            Tout compris
          </div>

          <div className="rounded-[28px] border border-[var(--line-strong)] bg-ink-700 p-8 shadow-2xl md:p-10 relative overflow-hidden">
            {/* Lueur subtile en fond */}
            <div className="glow-violet absolute inset-0 -z-10 opacity-30 pointer-events-none" />

            <div className="flex items-end gap-2">
              <span className="font-display text-[64px] font-bold leading-none tracking-[-0.02em] text-paper">
                50€
              </span>
              <span className="mb-2 text-[15px] text-faint">/ an</span>
            </div>
            <p className="mt-3 text-[15px] leading-[1.6] text-muted">
              Tout compris : hébergement, mises à jour et votre adresse. Facturé
              une fois par an, comme un nom de domaine. Ça fait moins de 5&nbsp;€/mois.
            </p>

            <ul className="mt-7 space-y-3">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[15px]">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mint-400/10 text-mint-400 border border-mint-400/20">
                    <IconCheck size={13} />
                  </span>
                  <span className="text-paper">{p}</span>
                </li>
              ))}
            </ul>

            <a
              href="#demo"
              className="btn-violet mt-8 block rounded-full px-7 py-4 text-center text-[15px] font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Lancer mon site · 50 €/an
            </a>
            <p className="mt-4 text-center font-hand text-[20px] text-gold-400">
              tout compris, moins de 5 €/mois ✦
            </p>
            <p className="mt-2 text-center text-[12.5px] text-faint">
              Des options avancées existent en abonnement, mais elles sont facultatives.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
