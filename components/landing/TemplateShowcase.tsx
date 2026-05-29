"use client";

import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import RevealWords from "./RevealWords";

const templates = [
  { id: "alice-r", name: "Aurelia", mood: "Sombre & chaud", tags: ["Éditorial", "Mariage", "Portrait"] },
  { id: "potozon", name: "Potozon", mood: "Pop & coloré", tags: ["Mode", "Studio", "Énergique"] },
  { id: "target", name: "Target", mood: "Éditorial & net", tags: ["Minimal", "Award", "Clean"] },
];

export default function TemplateShowcase() {
  return (
    <section id="templates" className="border-y border-line bg-paper-2 px-6 py-24">
      <div className="mx-auto max-w-[1200px]">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
          Les modèles
        </p>
        <RevealWords
          text="Trois designs. Vos photos en vedette."
          accent={[4, 5]}
          className="max-w-[20ch] text-balance font-display text-[30px] font-medium leading-[1.08] tracking-[-0.01em] text-ink md:text-[48px]"
        />
        <p className="mt-5 max-w-[42rem] text-[16px] leading-[1.6] text-ink-soft">
          Chaque site est déjà construit et déjà animé. On y met votre nom et vos
          photos — vous n'avez qu'à le mettre en ligne.
        </p>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-14 grid gap-6 md:grid-cols-3"
        >
          {templates.map((t) => (
            <motion.div
              key={t.id}
              variants={fadeUp}
              className="card-print group overflow-hidden rounded-[28px] border border-line transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_56px_-24px_rgba(28,26,23,0.3)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden border-b border-line bg-paper-2">
                <div className="absolute left-0 right-0 top-0 z-10 flex h-7 items-center gap-1.5 border-b border-line bg-card/90 px-3 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-ink/15" />
                  <span className="h-2 w-2 rounded-full bg-ink/15" />
                  <span className="h-2 w-2 rounded-full bg-ink/15" />
                </div>
                <iframe
                  src={`/_templates/${t.id}/index.html`}
                  title={t.name}
                  loading="lazy"
                  tabIndex={-1}
                  aria-hidden
                  className="pointer-events-none absolute left-0 top-7 origin-top-left transition-transform duration-500 group-hover:scale-[0.315]"
                  style={{ width: 1400, height: 1050, transform: "scale(0.305)" }}
                />
              </div>
              <div className="p-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-[24px] font-medium tracking-[-0.01em] text-ink">
                    {t.name}
                  </h3>
                  <span className="text-[13px] text-ink-faint">{t.mood}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {t.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-line bg-paper px-3 py-1 text-[12px] text-ink-soft">
                      {tag}
                    </span>
                  ))}
                </div>
                <a
                  href={`/_templates/${t.id}/index.html`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-terracotta hover:text-terracotta-dark"
                >
                  Voir en grand <span aria-hidden>→</span>
                </a>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
