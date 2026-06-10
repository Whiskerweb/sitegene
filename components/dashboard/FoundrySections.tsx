"use client";

/**
 * Plug-and-play « Mon site » : les sections de la recette en cartes.
 * Remplacer → catalogue filtré sur le rôle (mode swap) ; Retirer → API recette.
 * Hero et footer sont verrouillés (structure minimale garantie côté serveur).
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface SectionItem {
  index: number;
  component: string;
  roleLabel: string;
  role: string;
  rarity: "common" | "rare" | "epic";
  locked: boolean;
}

const RARITY_CHIP: Record<SectionItem["rarity"], { label: string; cls: string }> = {
  common: { label: "Commun", cls: "bg-neutral-100 text-neutral-500" },
  rare: { label: "Rare ✦", cls: "bg-violet-50 text-violet-600" },
  epic: { label: "Épique ✦✦", cls: "bg-amber-50 text-amber-700" },
};

export default function FoundrySections({ siteId, items }: { siteId: string; items: SectionItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(index: number) {
    setBusy(index);
    setError(null);
    try {
      const res = await fetch("/api/foundry/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, op: "remove", index }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Impossible de retirer cette section.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de retirer cette section.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {error ? (
        <p className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">{error}</p>
      ) : null}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {items.map((it) => {
          const r = RARITY_CHIP[it.rarity];
          return (
            <div
              key={it.index}
              className="card-hover flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gray-50 text-xs font-bold text-gray-400">
                  {it.index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-semibold text-gray-900">{it.roleLabel}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.cls}`}>{r.label}</span>
                  </div>
                  <code className="text-[11px] text-gray-400">{it.component}</code>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Link
                  href={`/dashboard/composants?role=${it.role}&swapIndex=${it.index}`}
                  className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12.5px] font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
                >
                  Remplacer
                </Link>
                {!it.locked && (
                  <button
                    type="button"
                    disabled={busy === it.index}
                    onClick={() => remove(it.index)}
                    className="rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    {busy === it.index ? "…" : "Retirer"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Link
        href="/dashboard/composants"
        className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3.5 text-[13.5px] font-semibold text-gray-500 transition hover:border-violet-300 hover:text-violet-600"
      >
        + Ajouter une section
      </Link>
    </div>
  );
}
