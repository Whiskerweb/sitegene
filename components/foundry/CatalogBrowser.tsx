"use client";
// components/foundry/CatalogBrowser.tsx — catalogue filtrable (sections + effets)
// + couche marketplace : prix par rareté, possession, « Voir sur mon site »
// (aperçu du composant DANS le site du client) et mode « Remplacer » (swap).
import { useState } from "react";
import { useRouter } from "next/navigation";

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

/** Contexte marketplace (fourni quand le compte a un site assemblé). */
export interface MarketContext {
  siteId: string | null;
  owned: string[];
  prices: Record<Rarity, number>;
  balance: number;
  /** Mode « Remplacer » : section du site à remplacer (depuis Mon site). */
  swap: { index: number; role: string } | null;
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

function PriceBadge({ it, owned, prices }: { it: CatalogItem; owned: boolean; prices: Record<Rarity, number> }) {
  if (it.type !== "section") return null;
  const price = prices[it.rarity];
  if (owned) {
    return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">Possédé ✓</span>;
  }
  if (price === 0) {
    return <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-500">Inclus</span>;
  }
  return <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{price} ✦</span>;
}

function Card({
  it,
  market,
  onPreview,
  onBuy,
  onUse,
  busy,
}: {
  it: CatalogItem;
  market: MarketContext | null;
  onPreview: (it: CatalogItem) => void;
  onBuy: (it: CatalogItem) => void;
  onUse: (it: CatalogItem) => void;
  busy: boolean;
}) {
  const r = RARITY[it.rarity];
  const t = TYPE_CHIP[it.type];
  const owned = !!market && (market.owned.includes(it.id) || market.prices[it.rarity] === 0);
  const swapMatch = !!market?.swap && it.type === "section" && it.role === market.swap.role;
  const showMarket = !!market && it.type === "section";

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
          {showMarket ? (
            <PriceBadge it={it} owned={market!.owned.includes(it.id)} prices={market!.prices} />
          ) : (
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-500">{it.id}</code>
          )}
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{it.description}</p>
        {it.whenToUse.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {it.whenToUse.slice(0, 3).map((w) => (
              <span key={w} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">{w}</span>
            ))}
          </div>
        )}

        {/* Couche marketplace */}
        {showMarket && (
          <div className="mt-4 flex items-center gap-2 border-t border-neutral-100 pt-3">
            {market!.siteId && (
              <button
                type="button"
                onClick={() => onPreview(it)}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-[12.5px] font-semibold text-neutral-700 transition hover:border-neutral-400"
              >
                Voir sur mon site
              </button>
            )}
            {swapMatch && owned && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onUse(it)}
                className="rounded-lg bg-neutral-900 px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
              >
                {busy ? "…" : "Utiliser cette section"}
              </button>
            )}
            {!owned && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onBuy(it)}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
              >
                {busy ? "…" : `Débloquer · ${market!.prices[it.rarity]} ✦`}
              </button>
            )}
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
  market = null,
  initialCat = "all",
}: {
  items: CatalogItem[];
  categoryOrder: string[];
  categoryLabel: Record<string, string>;
  market?: MarketContext | null;
  initialCat?: string;
}) {
  const router = useRouter();
  const [cat, setCat] = useState<string>(initialCat);
  const [rarity, setRarity] = useState<Rarity | "all">("all");
  const [type, setType] = useState<ItemType | "all">("all");
  const [owned, setOwned] = useState<string[]>(market?.owned ?? []);
  const [balance, setBalance] = useState<number>(market?.balance ?? 0);
  const [preview, setPreview] = useState<CatalogItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const ctx: MarketContext | null = market ? { ...market, owned, balance } : null;

  async function buy(it: CatalogItem) {
    if (!market) return;
    setBusyId(it.id);
    setToast(null);
    try {
      const res = await fetch("/api/marketplace/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: "component", itemId: it.id }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 409) {
        setToast(`Solde insuffisant (${data?.balance ?? 0} ✦) — il vous faut ${data?.needed ?? "?"} ✦.`);
        return;
      }
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Achat impossible.");
      setOwned((o) => (o.includes(it.id) ? o : [...o, it.id]));
      if (typeof data.balance === "number") setBalance(data.balance);
      setToast(`« ${it.name} » débloqué ✓ (licence ${data.licenseCode})`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Achat impossible.");
    } finally {
      setBusyId(null);
    }
  }

  async function use(it: CatalogItem) {
    if (!market?.siteId || !market.swap) return;
    setBusyId(it.id);
    setToast(null);
    try {
      const res = await fetch("/api/foundry/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: market.siteId, op: "swap", index: market.swap.index, componentId: it.id }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 402) {
        setToast(`« ${it.name} » doit d'abord être débloqué (${data?.price ?? "?"} ✦).`);
        return;
      }
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Remplacement impossible.");
      router.push("/dashboard");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Remplacement impossible.");
    } finally {
      setBusyId(null);
    }
  }

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
      {/* Bandeau mode « Remplacer » */}
      {market?.swap && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3">
          <p className="text-sm font-medium text-violet-700">
            Mode remplacement : choisissez la nouvelle forme de votre section «{" "}
            {categoryLabel[market.swap.role] ?? market.swap.role} ».
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="shrink-0 text-sm font-semibold text-violet-600 underline-offset-2 hover:underline"
          >
            Annuler
          </button>
        </div>
      )}

      {toast && (
        <div className="mb-5 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 shadow-sm">
          {toast}
          {toast.includes("insuffisant") && (
            <a href="/dashboard/credits" className="ml-2 font-semibold text-blue-600 underline-offset-2 hover:underline">
              Recharger →
            </a>
          )}
        </div>
      )}

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
        <p className="text-xs text-neutral-400">
          {filtered.length} pièce{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
          {ctx ? ` · solde ${balance} ✦` : ""}
        </p>
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
                <Card
                  key={`${it.type}-${it.id}`}
                  it={it}
                  market={ctx}
                  onPreview={setPreview}
                  onBuy={buy}
                  onUse={use}
                  busy={busyId === it.id}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Modale « Voir sur mon site » : le composant DANS le site du client */}
      {preview && market?.siteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-8" onClick={() => setPreview(null)}>
          <div
            className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
              <div>
                <h3 className="text-[15px] font-semibold text-neutral-900">{preview.name} — sur votre site</h3>
                <p className="text-[12px] text-neutral-500">La section mise en avant est celle que vous regardez.</p>
              </div>
              <div className="flex items-center gap-2">
                {market.swap && preview.role === market.swap.role && (owned.includes(preview.id) || market.prices[preview.rarity] === 0) && (
                  <button
                    type="button"
                    disabled={busyId === preview.id}
                    onClick={() => use(preview)}
                    className="rounded-lg bg-neutral-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
                  >
                    Utiliser cette section
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-[13px] font-semibold text-neutral-600 transition hover:border-neutral-400"
                >
                  Fermer
                </button>
              </div>
            </div>
            <iframe src={`/site-preview/${market.siteId}?swap=${preview.id}`} title={`${preview.name} sur votre site`} className="h-full w-full flex-1" />
          </div>
        </div>
      )}
    </div>
  );
}
