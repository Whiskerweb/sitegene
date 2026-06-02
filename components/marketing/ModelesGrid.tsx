"use client";

import { useState } from "react";
import { REALISATIONS, SHOWCASE_FILTERS } from "@/lib/showcase";
import TemplateCard from "./TemplateCard";

/** Grille de modèles filtrable par catégorie (page /modeles). */
export default function ModelesGrid() {
  const [active, setActive] = useState("tous");

  const visible = REALISATIONS.filter((r) => active === "tous" || r.categoryId === active);

  return (
    <div>
      <div className="mb-10 flex flex-wrap gap-2">
        {SHOWCASE_FILTERS.map((f) => {
          const isActive = active === f.id;
          return (
            <button
              key={f.id}
              type="button"
              disabled={f.soon}
              onClick={() => !f.soon && setActive(f.id)}
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-medium transition-all",
                f.soon
                  ? "cursor-not-allowed border-[rgb(var(--m-line))] text-[rgb(var(--m-faint)/0.6)]"
                  : isActive
                    ? "border-[rgb(var(--m-accent)/0.5)] bg-[rgb(var(--m-accent)/0.15)] text-[rgb(var(--m-ink))]"
                    : "border-[rgb(var(--m-line))] bg-[rgb(var(--m-overlay)/0.03)] text-[rgb(var(--m-muted))] hover:border-[rgb(var(--m-accent)/0.4)] hover:text-[rgb(var(--m-ink))]",
              ].join(" ")}
            >
              {f.label}
              {f.soon && (
                <span className="rounded-full bg-[rgb(var(--m-overlay)/0.06)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[rgb(var(--m-faint))]">
                  Bientôt
                </span>
              )}
            </button>
          );
        })}
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => (
            <TemplateCard key={r.id} r={r} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-[rgb(var(--m-line))] bg-[rgb(var(--m-overlay)/0.02)] px-6 py-16 text-center text-[14px] text-[rgb(var(--m-muted))]">
          De nouveaux modèles pour cette catégorie arrivent très bientôt.
        </p>
      )}
    </div>
  );
}
