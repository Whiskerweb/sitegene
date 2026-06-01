"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import { IconCheck } from "@/components/ui/icons";

const STEP_MS = 1650;

/**
 * Écran de chargement scénarisé du tunnel : orbe IA + étapes qui se cochent une
 * à une + barre de progression. Donne le temps à la génération réelle de
 * tourner sans écran vide. Appelle `onDone` une fois la dernière étape atteinte
 * (le parent attend ET la fin des étapes ET la réponse réseau avant de révéler).
 */
export default function LoadingSteps({
  categoryLabel,
  onDone,
}: {
  categoryLabel: string;
  onDone: () => void;
}) {
  const steps = [
    "Analyse de votre activité",
    "Conception de la structure",
    `Choix du modèle le plus adapté à un·e ${categoryLabel.toLowerCase()}`,
    "Mise en page de vos photos",
    "Touches finales & animations",
  ];
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (active >= steps.length) {
      onDone();
      return;
    }
    const id = setTimeout(() => setActive((a) => a + 1), STEP_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const pct = Math.round((Math.min(active, steps.length) / steps.length) * 100);

  return (
    <section className="relative grid min-h-[100dvh] place-items-center overflow-hidden px-6 py-20">
      {/* atmosphère */}
      <div aria-hidden className="blob blob-blue absolute left-[12%] top-[18%] h-72 w-72" />
      <div aria-hidden className="blob blob-mint absolute bottom-[10%] right-[10%] h-64 w-64" />

      <div className="relative z-10 w-full max-w-[520px] text-center">
        <div className="sgai-orb-wrap mx-auto">
          <span className="sgai-orb-glow" />
          <span className="sgai-orb" />
        </div>

        <h1 className="mt-7 font-display text-[28px] font-medium leading-[1.1] tracking-[-0.01em] text-night md:text-[36px]">
          Akyra construit votre site…
        </h1>
        <p className="mx-auto mt-3 max-w-[34ch] text-[15px] leading-[1.6] text-slate">
          On assemble un vrai site, pensé pour vous. Quelques secondes.
        </p>

        {/* étapes */}
        <ul className="mx-auto mt-8 max-w-[420px] space-y-2.5 text-left">
          {steps.map((label, i) => {
            const done = i < active;
            const inProgress = i === active;
            return (
              <motion.li
                key={label}
                initial={{ opacity: 0, x: -8 }}
                animate={{
                  opacity: done || inProgress ? 1 : 0.4,
                  x: 0,
                }}
                transition={{ duration: 0.35, ease: EASE }}
                className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-white/70 px-4 py-2.5 backdrop-blur"
              >
                <span
                  className={`grid h-6 w-6 flex-none place-items-center rounded-full transition ${
                    done
                      ? "bg-success text-white"
                      : inProgress
                        ? "bg-brand/10 text-brand"
                        : "bg-sky-100 text-mist"
                  }`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {done ? (
                      <motion.span
                        key="done"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                      >
                        <IconCheck size={13} />
                      </motion.span>
                    ) : inProgress ? (
                      <span
                        key="spin"
                        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand/30 border-t-brand"
                      />
                    ) : (
                      <span key="dot" className="h-1.5 w-1.5 rounded-full bg-mist" />
                    )}
                  </AnimatePresence>
                </span>
                <span
                  className={`text-[14.5px] ${done ? "text-night" : inProgress ? "font-medium text-night" : "text-mist"}`}
                >
                  {label}
                </span>
              </motion.li>
            );
          })}
        </ul>

        {/* barre de progression */}
        <div className="mx-auto mt-8 h-1.5 w-full max-w-[420px] overflow-hidden rounded-full bg-sky-100">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand to-[#7aa7f0]"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: EASE }}
          />
        </div>
      </div>
    </section>
  );
}
