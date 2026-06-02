"use client";

import { useMemo, useState } from "react";
import { Eye, ArrowUpRight, Star } from "lucide-react";
import { REALISATIONS, SHOWCASE_FILTERS, type Realisation } from "@/lib/showcase";

type Sort = "popular" | "recent";

function MagnifierIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

/** Carte « browse » minimaliste : vignette + méta en dessous (façon aura). */
function BrowseCard({ r }: { r: Realisation }) {
  return (
    <a
      href={r.link}
      target={r.external ? "_blank" : undefined}
      rel={r.external ? "noreferrer" : undefined}
      className="group block"
    >
      <div
        className={`relative aspect-[16/11] overflow-hidden rounded-xl border bg-[rgb(var(--m-elevated))] transition-all duration-300 group-hover:-translate-y-[2px] ${
          r.featured
            ? "border-[rgb(var(--m-accent)/0.5)] shadow-[0_0_0_1px_rgb(var(--m-accent)/0.25),0_18px_50px_-24px_rgb(var(--m-accent)/0.4)]"
            : "border-[rgb(var(--m-line))] group-hover:border-[rgb(var(--m-overlay)/0.2)]"
        }`}
      >
        <img
          src={r.thumb}
          alt={r.title}
          loading="lazy"
          className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        {r.featured && (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-[rgb(var(--m-accent))] px-2 py-0.5 text-[10px] font-semibold text-[rgb(var(--m-on-accent))] shadow-sm">
            <Star size={10} className="fill-current" /> À la une
          </span>
        )}
        {!r.featured && r.badge === "Nouveau" && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-[rgb(var(--m-accent))] px-2 py-0.5 text-[10px] font-semibold text-[rgb(var(--m-on-accent))] shadow-sm">
            Nouveau
          </span>
        )}
        <span className="absolute bottom-2.5 right-2.5 grid h-7 w-7 place-items-center rounded-full bg-[rgb(var(--m-page)/0.7)] text-[rgb(var(--m-ink))] opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
          <ArrowUpRight size={14} />
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <h3 className="truncate text-[14px] font-medium text-[rgb(var(--m-ink))]">{r.title}</h3>
        {r.badge === "PRO" && (
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-[rgb(var(--m-faint))]">
            PRO
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[12px] text-[rgb(var(--m-faint))]">
        <span className="flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[rgb(var(--m-accent))] text-[8px] font-bold text-[rgb(var(--m-on-accent))]">
            A
          </span>
          Akyra
        </span>
        <span className="flex items-center gap-1">
          <Eye size={12} /> {r.views}
        </span>
      </div>
    </a>
  );
}

export default function ModelesGrid() {
  const [active, setActive] = useState("tous");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("popular");

  const visible = useMemo(() => {
    let list = REALISATIONS.filter((r) => active === "tous" || r.categoryId === active);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (r) => r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q),
      );
    }
    list = [...list].sort((a, b) =>
      sort === "popular" ? b.views - a.views : 0,
    );
    return list;
  }, [active, query, sort]);

  return (
    <div>
      {/* Barre de recherche + tri */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifierIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--m-faint))]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Rechercher parmi ${REALISATIONS.length} modèles…`}
            className="h-12 w-full rounded-xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] pl-11 pr-4 text-[14px] text-[rgb(var(--m-ink))] outline-none transition-colors placeholder:text-[rgb(var(--m-faint))] focus:border-[rgb(var(--m-overlay)/0.25)]"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] p-1">
          {([["popular", "Populaires"], ["recent", "Récents"]] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSort(id)}
              className={`rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors ${
                sort === id
                  ? "bg-[rgb(var(--m-overlay)/0.08)] text-[rgb(var(--m-ink))]"
                  : "text-[rgb(var(--m-muted))] hover:text-[rgb(var(--m-ink))]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chips de catégorie */}
      <div className="mt-5 flex flex-wrap gap-2">
        {SHOWCASE_FILTERS.map((f) => {
          const isActive = active === f.id;
          return (
            <button
              key={f.id}
              type="button"
              disabled={f.soon}
              onClick={() => !f.soon && setActive(f.id)}
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[13px] font-medium transition-all",
                f.soon
                  ? "cursor-not-allowed border-[rgb(var(--m-line))] text-[rgb(var(--m-faint)/0.6)]"
                  : isActive
                    ? "border-[rgb(var(--m-accent)/0.5)] bg-[rgb(var(--m-accent)/0.12)] text-[rgb(var(--m-ink))]"
                    : "border-[rgb(var(--m-line))] text-[rgb(var(--m-muted))] hover:border-[rgb(var(--m-overlay)/0.2)] hover:text-[rgb(var(--m-ink))]",
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

      {/* Grille */}
      {visible.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((r) => (
            <BrowseCard key={r.id} r={r} />
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-xl border border-dashed border-[rgb(var(--m-line))] bg-[rgb(var(--m-overlay)/0.02)] px-6 py-16 text-center text-[14px] text-[rgb(var(--m-muted))]">
          Aucun modèle ne correspond. Essayez une autre recherche ou catégorie.
        </p>
      )}
    </div>
  );
}
