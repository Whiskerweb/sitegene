"use client";

import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import RevealWords from "./RevealWords";

const steps = [
  { n: "1", title: "Choisissez un design", body: "Trois studios pensés pour les photographes. Vous prenez celui qui vous ressemble." },
  { n: "2", title: "Déposez vos photos", body: "Vous glissez vos clichés et vos infos. On place tout au bon endroit pour vous." },
  { n: "3", title: "Publiez", body: "Votre portfolio est en ligne, joignable au monde entier. En 30 secondes.", live: true },
];

export default function HowItWorks() {
  return (
    <section id="how" className="px-6 py-24">
      <div className="mx-auto max-w-[1200px]">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
          Comment ça marche
        </p>
        <RevealWords
          text="Trois étapes. La dernière, c'est juste regarder."
          accent={[4]}
          className="max-w-[20ch] text-balance font-display text-[30px] font-medium leading-[1.08] tracking-[-0.01em] text-ink md:text-[48px]"
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-14 grid gap-6 md:grid-cols-3"
        >
          {steps.map((s) => (
            <motion.div
              key={s.n}
              variants={fadeUp}
              className="card-print rounded-[28px] border border-line p-8 transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="grid h-10 w-10 place-items-center rounded-full bg-terracotta/12 font-display text-[20px] font-semibold text-terracotta">
                {s.n}
              </div>
              <h3 className="mt-6 flex items-center gap-2 font-display text-[24px] font-medium tracking-[-0.01em] text-ink">
                {s.title}
                {s.live && <span className="dot-live h-2.5 w-2.5 rounded-full bg-sage" />}
              </h3>
              <p className="mt-3 max-w-[30ch] text-[15px] leading-[1.6] text-ink-soft">{s.body}</p>
              {s.live && (
                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-[13px] text-ink-soft">
                  <span className="text-sage">●</span> vous.sitegene.com
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
