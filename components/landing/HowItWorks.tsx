"use client";

import { motion } from "framer-motion";
import { EASE, fadeUp, stagger, viewportOnce } from "@/lib/motion";
import RevealWords from "./RevealWords";
import { IconSpark, IconPhoto, IconCloud } from "@/components/ui/icons";

const steps = [
  {
    n: "1",
    icon: <IconSpark size={22} />,
    title: "Décrivez-vous",
    body: "Deux lignes sur vous : qui vous êtes, ce que vous proposez. C'est tout ce qu'on demande pour démarrer.",
  },
  {
    n: "2",
    icon: <IconPhoto size={22} />,
    title: "Ajoutez vos photos",
    body: "Vous déposez quelques photos, ou aucune. On les place et on les met en valeur au bon endroit, pour vous.",
  },
  {
    n: "3",
    icon: <IconCloud size={22} />,
    title: "Choisissez & publiez",
    body: "Vous prenez votre design préféré et votre site part en ligne. Ensuite vous le modifiez quand vous voulez : textes et photos à la main, mise en page et couleurs en le demandant à l'IA.",
    live: true,
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="bg-ink-900 border-b border-[var(--line)] px-6 py-24">
      <div className="mx-auto max-w-[1240px]">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-violet-400">
          Comment ça marche
        </p>
        <RevealWords
          text="Trois étapes. La dernière, c'est juste regarder."
          accent={[4]}
          accentClass="text-violet-400"
          className="max-w-[20ch] text-balance font-display text-[30px] font-bold leading-[1.08] tracking-[-0.01em] text-paper md:text-[48px]"
        />

        <div className="relative mt-14">
          {/* Connecteur pointillé animé entre les cartes */}
          <svg
            aria-hidden
            className="absolute left-0 top-[40px] hidden h-4 w-full md:block"
            preserveAspectRatio="none"
            viewBox="0 0 100 4"
          >
            <motion.line
              x1="16" y1="2" x2="84" y2="2"
              stroke="var(--color-violet-500)"
              strokeWidth="0.4"
              strokeDasharray="1.4 1.6"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.45 }}
              viewport={viewportOnce}
              transition={{ duration: 1.1, ease: EASE }}
            />
          </svg>

          <div className="relative grid gap-6 md:grid-cols-3">
            {steps.map((s, idx) => (
              <div
                key={s.n}
                className={`animate-on-scroll delay-${idx + 1} rounded-[28px] border border-[var(--line)] bg-ink-800 p-8 shadow-2xl transition hover:border-violet-500/20 hover:-translate-y-1.5 duration-300`}
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-700 text-violet-400 border border-[var(--line)]">
                    {s.icon}
                  </span>
                  <span className="font-display text-[22px] font-bold text-gold-400">0{s.n}</span>
                </div>
                <h3 className="mt-6 flex items-center gap-2 font-display text-[24px] font-bold tracking-[-0.01em] text-paper">
                  {s.title}
                  {s.live && <span className="dot-live h-2.5 w-2.5 rounded-full bg-mint-400" />}
                </h3>
                <p className="mt-3 max-w-[32ch] text-[15px] leading-[1.6] text-muted">{s.body}</p>
                {s.live && (
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-ink-700 px-3 py-1.5 text-[13px] text-muted">
                    <span className="dot-live h-1.5 w-1.5 rounded-full bg-mint-400" /> vous.akyra.com
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-16 flex justify-center"
        >
          <a
            href="#demo"
            className="btn-violet inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            Mettre mon site en ligne <span aria-hidden>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

