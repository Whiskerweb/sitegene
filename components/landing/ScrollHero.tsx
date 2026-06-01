"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import { CosmicParallaxBg } from "@/components/ui/parallax-cosmic-background";
import IntakeCard from "./IntakeCard";
import { LiquidGlassFilter } from "@/components/ui/LiquidGlass";
import { setIntake, type IntakePayload } from "@/lib/intake-store";
import { IconCheck } from "@/components/ui/icons";

/**
 * Hero direct (above-the-fold) : value prop + champ de saisie visibles d'emblée
 * (reco CRO — l'essai gratuit est le meilleur argument, il ne se mérite pas au
 * scroll). Fond de ciel étoilé animé (CosmicParallaxBg) + carte en liquid glass.
 * « Voir mon site » → store mémoire + navigation vers le tunnel /create.
 */
const PROOF = [
  "Gratuit à essayer",
  "Sans carte",
  "Résultat en ~10 s",
];

export default function ScrollHero() {
  const router = useRouter();

  function handleSubmit(payload: IntakePayload) {
    setIntake(payload);
    router.push("/create");
  }

  return (
    <section className="relative isolate flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-28 md:pt-32">
      <LiquidGlassFilter />
      <CosmicParallaxBg bgOnly />
      {/* voile pour asseoir la lisibilité du contenu sur le ciel étoilé */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[#1f3a5f]/20 via-transparent to-[#0e2138]/40" />

      {/* Bandeau de titre */}
      <div className="relative z-10 mx-auto max-w-[860px] text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-[12.5px] font-semibold text-sky-100 backdrop-blur-md ring-1 ring-white/25"
        >
          <span className="dot-live h-1.5 w-1.5 rounded-full bg-success" />
          Sites pros pour photographes, musiciens & artisans
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.06 }}
          className="hero-serif mx-auto mt-6 max-w-[15ch] text-balance font-display text-[44px] font-medium leading-[0.98] tracking-[-0.02em] text-white md:text-[76px]"
        >
          Votre site pro, prêt en{" "}
          <span className="em text-[#f8cf55]">10 secondes.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.13 }}
          className="mx-auto mt-5 max-w-[50ch] text-[17px] leading-[1.6] text-sky-100/90 md:text-[19px]"
        >
          Décrivez votre activité en deux lignes, ajoutez vos photos si vous
          en avez, et regardez votre <b className="text-white">vrai site</b>{" "}
          s&apos;afficher. <b className="text-white">50&nbsp;€/an</b>, tout compris.
        </motion.p>
      </div>

      {/* Carte de saisie — liquid glass posé sur le ciel */}
      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, ease: EASE, delay: 0.2 }}
        className="relative z-10 mt-9 w-full max-w-[660px]"
      >
        <IntakeCard onSubmit={handleSubmit} variant="liquid" hideHeader />

        {/* Réassurance sous le champ */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {PROOF.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-sky-100/90"
            >
              <IconCheck size={14} className="text-mint-400" /> {p}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Indice de défilement */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="relative z-10 mt-12 flex flex-col items-center gap-1 text-[12px] font-medium uppercase tracking-[0.18em] text-sky-100/55"
      >
        <span>Voir des exemples</span>
        <span className="nudge-down text-lg leading-none text-sky-100/60">↓</span>
      </motion.div>
    </section>
  );
}
