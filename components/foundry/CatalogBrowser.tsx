"use client";
// components/foundry/CatalogBrowser.tsx — vue catalogue filtrable (sections + effets).
import { useState } from "react";

export type Rarity = "common" | "rare" | "epic";
export type ItemType = "section" | "effet";
export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  role: string;
  rarity: Rarity;
  type: ItemType;
  previewSrc: string;
  whenToUse: string[];
}

const RARITY: Record<Rarity, { label: string; bg: string; fg: string; dot: string }> = {
  common: { label: "Commun", bg: "#eef1e7", fg: "#5d6b3f", dot: "#8e9867" },
  rare: { label: "Rare", bg: "#f8e3da", fg: "#b15c3c", dot: "#e1937d" },
  epic: { label: "Épique", bg: "#f3e6c6", fg: "#8a5a14", dot: "#d8a23a" },
};
const TYPE_CHIP: Record<ItemType, { label: string; bg: string; fg: string }> = {
  section: { label: "Section", bg: "#eef0f4", fg: "#475569" },
  effet: { label: "Effet", bg: "#ece9fb", fg: "#6d4aff" },
};

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
      style={
        active
          ? { background: "#0d0503", color: "#fff", borderColor: "#0d0503" }
          : { background: "#fff", color: "#475569", borderColor: "rgba(0,0,0,.12)" }
      }
    >
      {children}
    </button>
  );
}

function Card({ it }: { it: CatalogItem }) {
  const r = RARITY[it.rarity];
  const t = TYPE_CHIP[it.type];
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="relative h-[260px] w-full overflow-hidden border-b border-black/10 bg-[#fcfaf7]">
        <iframe
          src={it.previewSrc}
          title={it.id}
          loading="lazy"
          scrolling="no"
          tabIndex={-1}
          aria-hidden
          style={{ width: "1266px", height: "866px", border: 0, transform: "scale(0.30)", transformOrigin: "top left", pointerEvents: "none" }}
        />
        <span className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: t.bg, color: t.fg }}>{t.label}</span>
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: r.bg, color: r.fg }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.dot }} />
          {r.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-neutral-900">{it.name}</h3>
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-500">{it.id}</code>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{it.description}</p>
        {it.whenToUse.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {it.whenToUse.slice(0, 3).map((w) => (
              <span key={w} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">{w}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default function CatalogBrowser({
  items,
  categoryOrder,
  categoryLabel,
}: {
  items: CatalogItem[];
  categoryOrder: string[];
  categoryLabel: Record<string, string>;
}) {
  const [cat, setCat] = useState<string>("all");
  const [rarity, setRarity] = useState<Rarity | "all">("all");
  const [type, setType] = useState<ItemType | "all">("all");

  // catégories présentes, dans l'ordre voulu puis le reste
  const present = Array.from(new Set(items.map((i) => i.role)));
  const cats = [
    ...categoryOrder.filter((c) => present.includes(c)),
    ...present.filter((c) => !categoryOrder.includes(c)).sort(),
  ];

  const filtered = items.filter(
    (i) => (cat === "all" || i.role === cat) && (rarity === "all" || i.rarity === rarity) && (type === "all" || i.type === type),
  );
  const shownCats = cats.filter((c) => filtered.some((i) => i.role === c));

  return (
    <div>
      {/* Filtres */}
      <div className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Section</span>
          <Chip active={cat === "all"} onClick={() => setCat("all")}>Toutes</Chip>
          {cats.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{categoryLabel[c] ?? c}</Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Rareté</span>
          <Chip active={rarity === "all"} onClick={() => setRarity("all")}>Toutes</Chip>
          {(["common", "rare", "epic"] as Rarity[]).map((k) => (
            <Chip key={k} active={rarity === k} onClick={() => setRarity(k)}>{RARITY[k].label}</Chip>
          ))}
          <span className="ml-4 mr-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Type</span>
          <Chip active={type === "all"} onClick={() => setType("all")}>Tous</Chip>
          <Chip active={type === "section"} onClick={() => setType("section")}>Sections</Chip>
          <Chip active={type === "effet"} onClick={() => setType("effet")}>Effets</Chip>
        </div>
        <p className="text-xs text-neutral-400">{filtered.length} pièce{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}</p>
      </div>

      {/* Résultats groupés par section */}
      {shownCats.length === 0 && <p className="py-10 text-center text-sm text-neutral-400">Aucun composant pour ces filtres.</p>}
      {shownCats.map((c) => {
        const group = filtered.filter((i) => i.role === c);
        return (
          <section key={c} className="mb-10">
            <div className="mb-4 flex items-baseline gap-3 border-b border-black/10 pb-2">
              <h2 className="text-lg font-semibold text-neutral-900">{categoryLabel[c] ?? c}</h2>
              <span className="text-sm text-neutral-400">{group.length} forme{group.length > 1 ? "s" : ""}</span>
            </div>
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))" }}>
              {group.map((it) => (
                <Card key={`${it.type}-${it.id}`} it={it} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
