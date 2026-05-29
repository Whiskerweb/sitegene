"use client";

import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import RevealWords from "./RevealWords";

const steps = [
  {
    n: "01",
    title: "Clic",
    body: "Choisissez un design. Trois studios, pensés pour les photographes.",
  },
  {
    n: "02",
    title: "Reveal",
    body: "On l'habille de vos infos et de vos photos. Vous le voyez prendre vie.",
  },
  {
    n: "03",
    title: "En ligne",
    body: "C'est publié. Votre portfolio est joignable au monde entier.",
    live: true,
  },
];

export default function HowItWorks() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-[1240px]">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.18em] accent">
          Comment ça marche
        </p>
        <RevealWords
          text="Trois étapes. La dernière, c'est juste regarder."
          accent={[4]}
          className="mx-auto max-w-[20ch] text-balance text-center font-display text-[30px] font-semibold leading-[1.06] tracking-[-0.02em] md:text-[48px]"
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-16 grid gap-6 md:grid-cols-3"
        >
          {steps.map((s) => (
            <motion.div
              key={s.n}
              variants={fadeUp}
              className="group relative overflow-hidden rounded-[24px] border border-line bg-ink-700 p-8 transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="font-display text-[56px] font-semibold leading-none tracking-[-0.02em] accent-gold">
                {s.n}
              </div>
              <h3 className="mt-6 flex items-center gap-2 font-display text-[24px] font-medium tracking-[-0.01em]">
                {s.title}
                {s.live && (
                  <span className="relative ml-1 inline-grid h-2.5 w-2.5 place-items-center">
                    <span className="dot-live h-2.5 w-2.5 rounded-full bg-mint-400" />
                  </span>
                )}
              </h3>
              <p className="mt-3 max-w-[28ch] text-[15px] leading-[1.6] text-muted">
                {s.body}
              </p>
              {s.live && (
                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-ink-900 px-3 py-1.5 text-[13px] text-faint">
                  <span className="text-mint-400">●</span>
                  vous.sitegene.com
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
