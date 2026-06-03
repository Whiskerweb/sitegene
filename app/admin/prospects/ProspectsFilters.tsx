"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { CRM_CATEGORIES } from "@/lib/crm/categories";
import { PIPELINE_STAGES, PIPELINE_STATUSES } from "@/lib/crm/stages";

type Props = {
  view: "table" | "kanban";
  sort: string;
  showAll: boolean;
  sp: Record<string, string | undefined>;
};

export function ProspectsFilters({ view, sort, showAll, sp }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(sp.q ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pushWith(mut: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mut(next);
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  function setParam(key: string, value: string) {
    pushWith((p) => {
      if (value) p.set(key, value);
      else p.delete(key);
    });
  }

  // Recherche debouncée.
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      if ((sp.q ?? "") !== q) setParam("q", q);
    }, 350);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const selCls =
    "rounded-lg border border-line bg-ink-800 px-3 py-2 text-sm text-paper outline-none focus:border-violet-400/50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Bascule Tableau ⇆ Pipeline */}
      <div className="inline-flex overflow-hidden rounded-lg border border-line">
        <button
          type="button"
          onClick={() => setParam("view", "table")}
          className={`px-3 py-2 text-sm ${view === "table" ? "bg-violet-500 text-white" : "bg-ink-800 text-muted hover:text-paper"}`}
        >
          ▦ Tableau
        </button>
        <button
          type="button"
          onClick={() => setParam("view", "kanban")}
          className={`px-3 py-2 text-sm ${view === "kanban" ? "bg-violet-500 text-white" : "bg-ink-800 text-muted hover:text-paper"}`}
        >
          ▥ Pipeline
        </button>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher (nom, email, entreprise)…"
        className={`${selCls} min-w-[220px] flex-1`}
      />

      <select value={sp.cat ?? ""} onChange={(e) => setParam("cat", e.target.value)} className={selCls}>
        <option value="">Toutes catégories</option>
        {CRM_CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      {view === "table" && (
        <select value={sp.stage ?? ""} onChange={(e) => setParam("stage", e.target.value)} className={selCls}>
          <option value="">Toutes étapes</option>
          {PIPELINE_STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      )}

      <select value={sp.status ?? ""} onChange={(e) => setParam("status", e.target.value)} className={selCls}>
        <option value="">Statut : actifs</option>
        {PIPELINE_STATUSES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>

      <select value={sort} onChange={(e) => setParam("sort", e.target.value)} className={selCls}>
        <option value="score">Tri : température</option>
        <option value="signal">Tri : dernier signal</option>
        <option value="recent">Tri : récents</option>
      </select>

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-ink-800 px-3 py-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={showAll}
          onChange={(e) => setParam("all", e.target.checked ? "1" : "")}
          className="accent-violet-500"
        />
        Inclure perdus
      </label>

      {isPending ? <span className="text-xs text-faint">…</span> : null}
    </div>
  );
}
