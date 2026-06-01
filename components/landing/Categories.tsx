"use client";

import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import RevealWords from "./RevealWords";
import { CATEGORIES } from "@/lib/categories";

/** Section positionnement : Akyra n'est pas que pour les photographes. */
export default function Categories() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-[1240px]">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Pour qui ?
        </p>
        <RevealWords
          text="Un vrai site, quel que soit votre métier."
          accent={[2]}
          accentClass="text-brand"
          className="max-w-[22ch] text-balance font-display text-[30px] font-medium leading-[1.08] tracking-[-0.01em] text-night md:text-[48px]"
        />
        <p className="mt-4 max-w-[52ch] text-[16px] leading-[1.6] text-slate">
          Chaque métier a ses propres modèles, pensés pour lui. On commence par
          les photographes. Les musiciens et les artisans arrivent très vite.
        </p>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-12 grid gap-5 md:grid-cols-3"
        >
          {CATEGORIES.map((c) => (
            <motion.div
              key={c.id}
              variants={fadeUp}
              className={`relative overflow-hidden rounded-[28px] border p-8 ${
                c.active
                  ? "border-sky-200 bg-surface-2 shadow-cloud-sm"
                  : "border-dashed border-sky-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-[24px] font-medium tracking-[-0.01em] text-night">
                  {c.label}
                </h3>
                {c.active ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-[12px] font-semibold text-success">
                    <span className="dot-live h-1.5 w-1.5 rounded-full bg-success" />
                    Disponible
                  </span>
                ) : (
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-mist">
                    Bientôt
                  </span>
                )}
              </div>
              <p className="mt-3 text-[15px] leading-[1.6] text-slate">
                {c.tagline}
              </p>
              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1.5 text-[13px] text-mist">
                {c.exampleDomain}
              </p>
              {c.active && c.templateIds.length > 0 && (
                <p className="mt-4 text-[13px] font-semibold text-brand">
                  {c.templateIds.length} modèles au choix
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
