"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { fadeUp, stagger, headingWord } from "@/lib/motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { BorderBeam } from "@/components/ui/border-beam";
import { IconStar4, IconArrowUp, IconSpark, IconCheck } from "@/components/ui/icons";
import {
  FORMULAS,
  FORMULA_CATEGORIES,
  type FormulaCategory,
} from "@/lib/formulas-teaser";

const HERO_TITLE = "Transforme ton site en 1 clic.";

const categoryIcon = (cat: FormulaCategory) =>
  cat === "design" ? <IconStar4 size={20} /> : <IconArrowUp size={20} />;
const categoryLabel = (cat: FormulaCategory) => (cat === "design" ? "Design" : "SEO");

export default function Marketplace() {
  const [filter, setFilter] = useState<FormulaCategory | "all">("all");
  const list = FORMULAS.filter((f) => filter === "all" || f.category === filter);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[28px] border border-sky-300 bg-gradient-to-br from-blue via-surface to-lav p-8 md:p-10">
        <BorderBeam size={360} duration={9} borderWidth={2} colorFrom="#7c3aed" colorTo="#22d3ee" />
        <Badge tone="brand">
          <IconSpark size={13} /> Bientôt
        </Badge>

        <motion.h1
          initial="hidden"
          animate="visible"
          className="mt-4 max-w-[18ch] font-archivo text-[34px] font-bold leading-[1.05] text-night md:text-[44px]"
        >
          {HERO_TITLE.split(" ").map((w, i) => (
            <span key={i} className="inline-block overflow-hidden align-bottom">
              <motion.span className="inline-block" variants={headingWord} custom={i}>
                {w}&nbsp;
              </motion.span>
            </span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-slate"
        >
          Choisis une formule design ou SEO, prévisualise-la directement sur ton site, et
          applique-la en un clic — comme on personnalise un personnage de jeu. Tout arrive très
          bientôt, et tout sera <span className="font-semibold text-brand">inclus dans l'abonnement illimité</span>.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-6"
        >
          <Link
            href="/dashboard/credits"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[15px] font-semibold text-white shadow-cloud-sm transition-all duration-200 hover:-translate-y-px hover:bg-brand-700 active:scale-[0.98]"
          >
            <IconSpark size={16} /> Débloquer tout avec l'illimité
          </Link>
        </motion.div>
      </section>

      {/* Filtres */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {FORMULA_CATEGORIES.map((c) => {
          const active = filter === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-brand text-white shadow-cloud-sm"
                  : "border border-sky-300 bg-white/60 text-slate hover:bg-sky-100 hover:text-night"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Grille de formules */}
      <motion.div
        key={filter}
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {list.map((f) => (
          <motion.div key={f.id} variants={fadeUp}>
            <GlassCard className="group relative h-full overflow-hidden border border-sky-300 p-0">
              {f.featured && (
                <BorderBeam size={240} duration={7} borderWidth={2} colorFrom="#2563eb" colorTo="#22d3ee" />
              )}
              {/* Vignette */}
              <div
                className="relative flex h-32 items-center justify-center text-white"
                style={{ background: `linear-gradient(135deg, ${f.accent.from}, ${f.accent.to})` }}
              >
                <span className="transition-transform duration-300 group-hover:scale-110">
                  {categoryIcon(f.category)}
                </span>
                <div className="absolute right-3 top-3">
                  <Badge tone="neutral">Bientôt</Badge>
                </div>
              </div>
              {/* Corps */}
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-mist">
                  {categoryLabel(f.category)}
                </div>
                <h3 className="mt-1 font-archivo text-lg font-semibold text-night">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate">{f.blurb}</p>
                <span className="mt-4 inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-sky-300 bg-surface-2 px-3 py-1.5 text-sm font-medium text-mist">
                  <IconCheck size={14} /> Prévisualisation bientôt
                </span>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA bas de page */}
      <div className="relative mt-10 overflow-hidden rounded-[24px] border border-brand/30 bg-gradient-to-br from-lav via-surface to-blue p-7 text-center">
        <BorderBeam size={300} duration={9} borderWidth={2} colorFrom="#7c3aed" colorTo="#22d3ee" />
        <h2 className="font-archivo text-xl font-bold text-night">
          Sois prêt le jour du lancement
        </h2>
        <p className="mx-auto mt-2 max-w-[52ch] text-sm leading-relaxed text-slate">
          L'abonnement <span className="font-semibold text-brand">illimité à 9,99 €/mois</span> te
          donnera accès à toutes les formules, sans compter tes crédits.
        </p>
        <Link
          href="/dashboard/credits"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[15px] font-semibold text-white shadow-cloud-sm transition-all duration-200 hover:-translate-y-px hover:bg-brand-700 active:scale-[0.98]"
        >
          <IconSpark size={16} /> Passer à l'illimité
        </Link>
      </div>
    </>
  );
}
