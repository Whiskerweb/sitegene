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
    <section id="how" className="bg-surface-2 px-6 py-24">
      <div className="mx-auto max-w-[1240px]">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Comment ça marche
        </p>
        <RevealWords
          text="Trois étapes. La dernière, c'est juste regarder."
          accent={[4]}
          accentClass="text-brand"
          className="max-w-[20ch] text-balance font-display text-[30px] font-medium leading-[1.08] tracking-[-0.01em] text-night md:text-[48px]"
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
              stroke="var(--color-brand)"
              strokeWidth="0.4"
              strokeDasharray="1.4 1.6"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.45 }}
              viewport={viewportOnce}
              transition={{ duration: 1.1, ease: EASE }}
            />
          </svg>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="relative grid gap-6 md:grid-cols-3"
          >
            {steps.map((s) => (
              <motion.div
                key={s.n}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="rounded-[28px] border border-sky-200 bg-white p-8 shadow-cloud-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue text-brand">
                    {s.icon}
                  </span>
                  <span className="font-display text-[18px] font-semibold text-mist">0{s.n}</span>
                </div>
                <h3 className="mt-6 flex items-center gap-2 font-display text-[24px] font-medium tracking-[-0.01em] text-night">
                  {s.title}
                  {s.live && <span className="dot-live h-2.5 w-2.5 rounded-full bg-success" />}
                </h3>
                <p className="mt-3 max-w-[32ch] text-[15px] leading-[1.6] text-slate">{s.body}</p>
                {s.live && (
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-surface-2 px-3 py-1.5 text-[13px] text-slate">
                    <span className="dot-live h-1.5 w-1.5 rounded-full bg-success" /> vous.akyra.com
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-12 flex justify-center"
        >
          <a
            href="#demo"
            className="btn-gold inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-bold transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            Commencer ma description <span aria-hidden>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

