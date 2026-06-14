"use client";
// components/foundry/CatalogBrowser.tsx — catalogue filtrable (sections + effets)
// + couche marketplace : prix par rareté, possession, « Voir sur mon site »
// (aperçu du composant DANS le site du client) et mode « Remplacer » (swap).
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Largeur de rendu « design » de l'aperçu (desktop) : la vignette le scale pour
// remplir la carte, et mesure la hauteur réelle du composant pour s'y ajuster.
const DESIGN_W = 1266;
const THUMB_MIN_H = 64;
const THUMB_MAX_H = 320;

/**
 * Vignette d'aperçu d'un composant : iframe rendu à `DESIGN_W` puis mis à
 * l'échelle pour remplir la largeur de la carte. On lit la hauteur naturelle du
 * contenu (même origine) pour dimensionner la carte au composant.
 *
 * PERF SCROLL : l'iframe n'est MONTÉE que lorsque la carte approche du viewport
 * (IntersectionObserver) et DÉMONTÉE quand elle s'en éloigne — sans ça, ~100
 * mini-sites complets (dont certains animés en continu) tournent et repeignent
 * en permanence, ce qui fait ramer le défilement. La hauteur mesurée est
 * conservée : pas de saut de mise en page quand l'iframe se démonte.
 */
function Thumb({ src, title }: { src: string; title: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [naturalH, setNaturalH] = useState(900);
  const [boxH, setBoxH] = useState(220);
  const [near, setNear] = useState(false);

  function recompute(width: number, nat: number) {
    const s = width > 0 ? width / DESIGN_W : 0.3;
    setScale(s);
    setBoxH(Math.min(THUMB_MAX_H, Math.max(THUMB_MIN_H, nat * s)));
  }

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => recompute(el.clientWidth, naturalH));
    ro.observe(el);
    return () => ro.disconnect();
  }, [naturalH]);

  // Montage paresseux : iframe vivante seulement près du viewport (±600px).
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setNear(entries[0]?.isIntersecting ?? false),
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function onLoad(e: React.SyntheticEvent<HTMLIFrameElement>) {
    try {
      const doc = e.currentTarget.contentDocument;
      // Hauteur RÉELLE des sections (repère `sg-fit-root`) — pas celle de la page,
      // dont le <body> garde souvent un min-height plein écran (zone blanche).
      const root = doc?.getElementById("sg-fit-root");
      const nat = root?.scrollHeight || doc?.body?.scrollHeight || 0;
      if (nat > 0) {
        setNaturalH(nat);
        recompute(boxRef.current?.clientWidth ?? 0, nat);
      }
    } catch {
      /* cross-origin improbable (même origine) — on garde la hauteur par défaut */
    }
  }

  return (
    <div ref={boxRef} className="relative w-full overflow-hidden bg-[#fcfaf7]" style={{ height: boxH }}>
      {near && (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          scrolling="no"
          tabIndex={-1}
          aria-hidden
          onLoad={onLoad}
          style={{
            width: DESIGN_W,
            height: naturalH,
            border: 0,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

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
  const owned = !!market && (market.owned.includes(it.id) || market.prices[it.rarity] === 0);
  const swapMatch = !!market?.swap && it.type === "section" && it.role === market.swap.role;
  const showMarket = !!market && it.type === "section";

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="w-full border-b border-black/10">
        <Thumb src={it.previewSrc} title={it.id} />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-neutral-900">{it.name}</h3>
          {showMarket ? <PriceBadge it={it} owned={market!.owned.includes(it.id)} prices={market!.prices} /> : null}
        </div>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-neutral-500">{it.description}</p>

        {/* Pied de carte : actions (à gauche) + rareté (à droite) sur la même ligne */}
        <div className="mt-4 flex items-center gap-2 border-t border-neutral-100 pt-3">
          {showMarket && market!.siteId && (
            <button
              type="button"
              onClick={() => onPreview(it)}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-[12.5px] font-semibold text-neutral-700 transition hover:border-neutral-400"
            >
              Voir sur mon site
            </button>
          )}
          {showMarket && swapMatch && owned && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onUse(it)}
              className="rounded-lg bg-neutral-900 px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
            >
              {busy ? "…" : "Utiliser cette section"}
            </button>
          )}
          {showMarket && !owned && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onBuy(it)}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
            >
              {busy ? "…" : `Débloquer · ${market!.prices[it.rarity]} ✦`}
            </button>
          )}
          <span
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: r.bg, color: r.fg }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.dot }} />
            {r.label}
          </span>
        </div>
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
  // Onglet courant : les sections d'abord (les effets sont une vue à part).
  const [type, setType] = useState<ItemType | "all">("section");
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

      {/* Filtres — une vue simple : onglets de type, puis une rangée catégories + rareté */}
      <div className="mb-7 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-black/10">
          <div className="flex gap-1">
            {([
              ["section", "Sections"],
              ["effet", "Effets"],
            ] as Array<[ItemType, string]>).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => { setType(k); setCat("all"); }}
                className={`-mb-px border-b-2 px-4 py-2.5 text-[15px] font-semibold transition-colors ${
                  type === k ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-400 hover:text-neutral-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {ctx ? <span className="text-xs font-medium text-neutral-400">Solde {balance} ✦</span> : null}
        </div>
        {/* Toolbar : catégories en bande défilable (1 ligne) + rareté en contrôle segmenté */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:min-w-0 lg:flex-1">
            <div className="flex w-max gap-2">
              <Chip active={cat === "all"} onClick={() => setCat("all")}>Tout</Chip>
              {cats.map((c) => (
                <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{categoryLabel[c] ?? c}</Chip>
              ))}
            </div>
          </div>
          <div className="inline-flex shrink-0 self-start rounded-full bg-neutral-100 p-1 lg:self-auto">
            {([["all", "Tout"], ["common", "Commun"], ["rare", "Rare"], ["epic", "Épique"]] as Array<[Rarity | "all", string]>).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setRarity(k)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                  rarity === k ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
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

      {/* Aperçu « Voir sur mon site » en PLEIN ÉCRAN : couvre toute l'interface
          (sidebar du dashboard comprise) pour voir le site sans rien autour. */}
      {preview && market?.siteId && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white">
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
          <iframe src={`/site-preview/${market.siteId}?swap=${preview.id}`} title={`${preview.name} sur votre site`} className="w-full flex-1" />
        </div>
      )}
    </div>
  );
}
