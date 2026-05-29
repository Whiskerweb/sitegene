"use client";

import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import RevealWords from "./RevealWords";

const templates = [
  {
    id: "alice-r",
    name: "Aurelia",
    mood: "Sombre & chaud",
    tags: ["Éditorial", "Mariage", "Portrait"],
    poster: "linear-gradient(140deg,#2a1c14,#0c0a09)",
  },
  {
    id: "potozon",
    name: "Potozon",
    mood: "Pop & coloré",
    tags: ["Mode", "Studio", "Énergique"],
    poster: "linear-gradient(140deg,#3a1410,#1a0f0c)",
  },
  {
    id: "target",
    name: "Target",
    mood: "Éditorial & net",
    tags: ["Minimal", "Award", "Clean"],
    poster: "linear-gradient(140deg,#26201a,#0d0c0b)",
  },
];

export default function TemplateShowcase() {
  return (
    <section id="templates" className="px-6 py-24">
      <div className="mx-auto max-w-[1240px]">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.18em] accent-gold">
          La cimaise
        </p>
        <RevealWords
          text="Trois designs. Choisissez le vôtre."
          accent={[4]}
          className="mx-auto max-w-[20ch] text-balance text-center font-display text-[30px] font-semibold leading-[1.06] tracking-[-0.02em] md:text-[48px]"
        />
        <p className="mx-auto mt-5 max-w-[40rem] text-center text-[15px] leading-[1.6] text-muted">
          Chaque site est déjà construit, déjà animé. On y met votre nom et vos
          photos — vous n'avez qu'à le mettre en ligne.
        </p>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-16 grid gap-6 md:grid-cols-3"
        >
          {templates.map((t) => (
            <motion.div
              key={t.id}
              variants={fadeUp}
              className="group overflow-hidden rounded-[32px] border border-line bg-ink-700 transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-[0_18px_50px_-12px_rgba(82,38,224,0.45)]"
            >
              {/* Aperçu live (iframe du bundle prébuild) avec poster de secours */}
              <div
                className="relative aspect-[4/3] overflow-hidden border-b border-line"
                style={{ background: t.poster }}
              >
                {/* barre de navigateur factice */}
                <div className="absolute left-0 right-0 top-0 z-10 flex h-7 items-center gap-1.5 bg-ink-900/80 px-3 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                </div>
                <iframe
                  src={`/_templates/${t.id}/index.html`}
                  title={t.name}
                  loading="lazy"
                  tabIndex={-1}
                  aria-hidden
                  className="pointer-events-none absolute left-0 top-7 origin-top-left"
                  style={{
                    width: 1400,
                    height: 1050,
                    transform: "scale(0.305)",
                  }}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/40 to-transparent transition-opacity duration-300 group-hover:opacity-0" />
              </div>

              <div className="p-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-[24px] font-medium tracking-[-0.01em]">
                    {t.name}
                  </h3>
                  <span className="text-[13px] text-faint">{t.mood}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-line bg-ink-900 px-3 py-1 text-[12px] text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <a
                  href={`/_templates/${t.id}/index.html`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-violet-400 transition-colors hover:text-violet-500"
                >
                  Voir en live
                  <span aria-hidden>→</span>
                </a>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
