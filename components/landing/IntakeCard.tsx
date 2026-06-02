"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import CyclingWord from "./CyclingWord";
import { LiquidGlass } from "@/components/ui/LiquidGlass";
import { CATEGORIES, DEFAULT_CATEGORY, getCategory } from "@/lib/categories";
import type { IntakePayload } from "@/lib/intake-store";
import { IconPhoto, IconStar4, IconCheck } from "@/components/ui/icons";

/**
 * Carte de saisie du brief (chips catégorie + description + photos optionnelles
 * + CTA). Présentational : elle REMONTE le payload via `onSubmit` — la home le
 * met en store et navigue vers /create (aucune génération inline).
 *
 * `variant="liquid"` : enveloppe en verre liquide (hero). `hideHeader` : masque
 * le titre interne (le hero porte déjà son propre titre).
 */
export default function IntakeCard({
  onSubmit,
  busy = false,
  variant = "glass",
  hideHeader = false,
}: {
  onSubmit: (p: IntakePayload) => void;
  busy?: boolean;
  variant?: "glass" | "liquid";
  hideHeader?: boolean;
}) {
  const [categoryId, setCategoryId] = useState(DEFAULT_CATEGORY.id);
  const [brief, setBrief] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [company, setCompany] = useState(""); // honeypot
  const fileRef = useRef<HTMLInputElement>(null);

  const category = getCategory(categoryId) ?? DEFAULT_CATEGORY;
  const canSubmit = brief.trim().length > 2 && !busy;

  function addFiles(list: FileList | null) {
    if (!list) return;
    const imgs = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setPhotos((prev) => [...prev, ...imgs].slice(0, 12));
  }

  function submit() {
    if (!canSubmit) return;
    onSubmit({ categoryId, brief: brief.trim(), photos, company });
  }

  const inner = (
    <>
      {/* Chips catégories */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => {
            const selected = c.id === categoryId;
            return (
              <button
                key={c.id}
                type="button"
                disabled={!c.active}
                onClick={() => c.active && setCategoryId(c.id)}
                aria-pressed={selected}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition ${
                  selected
                    ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                    : c.active
                      ? "bg-ink-600 text-paper hover:bg-ink-600/80 hover:text-white border border-[var(--line)]"
                      : "cursor-not-allowed bg-ink-800 text-faint border border-[var(--line)] border-dashed"
                }`}
              >
                {c.label}
                {!c.active && (
                  <span className="rounded-full bg-ink-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-faint">
                    bientôt
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Champ brief */}
        <div className="rounded-[20px] border border-[var(--line)] bg-ink-800 p-3 transition focus-within:border-violet-500/50 focus-within:shadow-[0_0_24px_-4px_rgba(109,74,255,0.25)]">
          <textarea
            rows={3}
            value={brief}
            placeholder={category.briefPlaceholder}
            onChange={(e) => setBrief(e.target.value)}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 180) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            className="w-full resize-none bg-transparent text-[15px] leading-[1.55] text-paper outline-none placeholder:text-faint"
          />

          {/* Honeypot (caché) */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
          />

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-2.5">
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink-600 px-3 py-1.5 text-[13px] font-bold text-paper border border-[var(--line)] transition hover:bg-ink-600/70 hover:text-white"
              >
                <IconPhoto size={15} />
                {photos.length > 0
                  ? `${photos.length} photo${photos.length > 1 ? "s" : ""}`
                  : "Ajouter des photos"}
              </button>
              {photos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPhotos([])}
                  className="text-[12px] font-medium text-faint underline-offset-2 hover:text-muted hover:underline"
                >
                  retirer
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="btn-violet inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-[15px] font-bold text-white transition-transform enabled:hover:scale-[1.03] enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <IconStar4 size={15} />
              {busy ? "Un instant…" : "Voir mon site"}
            </button>
          </div>
        </div>

      <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-medium text-muted">
        <IconCheck size={13} className="flex-none text-mint-400" />
        {photos.length > 0
          ? "Vos photos seront placées au bon endroit."
          : "Pas de photos ? On met des démos, vous les remplacerez après."}
      </p>
    </>
  );

  const body =
    variant === "liquid" ? (
      <LiquidGlass className="p-5 text-left md:p-6">{inner}</LiquidGlass>
    ) : (
      <div className="glass relative rounded-[28px] p-5 text-left shadow-2xl md:p-6">
        {inner}
      </div>
    );

  return (
    <div className="mx-auto max-w-[640px]">
      {!hideHeader && (
        <div className="mb-6 text-center">
          <p className="mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-violet-400">
            Pour les{" "}
            <CyclingWord
              words={["photographes", "musiciens", "artisans"]}
              className="font-semibold text-violet-400"
            />
          </p>
          <h2 className="font-display text-[26px] font-medium leading-[1.1] tracking-[-0.01em] text-paper md:text-[34px]">
            Décrivez votre activité. <span className="em text-violet-400">On s&apos;occupe du reste.</span>
          </h2>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {body}
      </motion.div>
    </div>
  );
}
