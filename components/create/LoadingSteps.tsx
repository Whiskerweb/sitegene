"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import { IconCheck, IconStar4 } from "@/components/ui/icons";

const STEP_MS = 1650;

/**
 * Écran de chargement scénarisé du tunnel : orbe IA + étapes qui se cochent une
 * à une + barre de progression. Donne le temps à la génération réelle de
 * tourner sans écran vide. Appelle `onDone` une fois la dernière étape atteinte.
 * Version sombre Galerie de Nuit (Akyra).
 */
export default function LoadingSteps({
  categoryLabel,
  onDone,
}: {
  categoryLabel: string;
  onDone: () => void;
}) {
  const steps = [
    "Analyse de votre univers créatif",
    "Conception de la structure de navigation",
    `Sélection du modèle adapté à un·e ${categoryLabel.toLowerCase()}`,
    "Mise en page optimale de votre portfolio",
    "Application de la palette & finitions",
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
    <section className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-ink-900 text-paper px-6 py-20">
      {/* Atmosphère lumineuse Akyra */}
      <div aria-hidden className="absolute left-[10%] top-[15%] h-80 w-80 bg-violet-500/10 blur-[80px] rounded-full pointer-events-none" />
      <div aria-hidden className="absolute bottom-[10%] right-[10%] h-72 w-72 bg-gold-400/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-[520px] text-center">
        {/* Orbe IA Animé */}
        <div className="relative mx-auto h-24 w-24 flex items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-violet-500/10" />
          <span className="absolute h-16 w-16 rounded-full bg-[radial-gradient(circle_at_center,var(--color-violet-500),var(--color-violet-600))] shadow-[0_0_30px_rgba(109,74,255,0.6)] flex items-center justify-center">
            <IconStar4 size={24} className="text-white" />
          </span>
        </div>

        <h1 className="mt-8 font-display text-[28px] font-bold leading-tight tracking-[-0.02em] text-paper md:text-[36px]">
          Akyra façonne votre site…
        </h1>
        <p className="mx-auto mt-2 max-w-[34ch] text-[15px] leading-relaxed text-muted">
          Nous assemblons un site sur mesure d&apos;après vos indications.
        </p>

        {/* Étapes de Chargement */}
        <ul className="mx-auto mt-8 max-w-[420px] space-y-2.5 text-left">
          {steps.map((label, i) => {
            const done = i < active;
            const inProgress = i === active;
            return (
              <motion.li
                key={label}
                initial={{ opacity: 0, x: -8 }}
                animate={{
                  opacity: done || inProgress ? 1 : 0.35,
                  x: 0,
                }}
                transition={{ duration: 0.35, ease: EASE }}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur transition-all duration-300 ${
                  inProgress
                    ? "border-violet-500/30 bg-ink-800"
                    : done
                    ? "border-[var(--line)] bg-ink-800/40"
                    : "border-transparent bg-ink-800/10"
                }`}
              >
                <span
                  className={`grid h-6 w-6 flex-none place-items-center rounded-full transition-all duration-300 ${
                    done
                      ? "bg-violet-500 text-white"
                      : inProgress
                      ? "bg-violet-500/10 text-violet-400 border border-violet-500/30"
                      : "bg-ink-700 text-faint"
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
                        <IconCheck size={12} strokeWidth={3} />
                      </motion.span>
                    ) : inProgress ? (
                      <span
                        key="spin"
                        className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-violet-400/30 border-t-violet-400"
                      />
                    ) : (
                      <span key="dot" className="h-1.5 w-1.5 rounded-full bg-faint" />
                    )}
                  </AnimatePresence>
                </span>
                <span
                  className={`text-[14px] transition-colors duration-300 ${
                    done
                      ? "text-muted line-through decoration-white/10"
                      : inProgress
                      ? "font-semibold text-paper"
                      : "text-faint"
                  }`}
                >
                  {label}
                </span>
              </motion.li>
            );
          })}
        </ul>

        {/* Barre de Progression */}
        <div className="mx-auto mt-8 h-1.5 w-full max-w-[420px] overflow-hidden rounded-full bg-ink-700 border border-white/5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: EASE }}
          />
        </div>
      </div>
    </section>
  );
}
