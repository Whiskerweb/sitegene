import { listManifests } from "@/lib/foundry/manifests";
import { listEffects } from "@/lib/effects";
import type { Rarity } from "@/lib/foundry/types";

export const dynamic = "force-dynamic";

// Libellés FR des catégories (= role du composant)
const CATEGORY_LABEL: Record<string, string> = {
  hero: "En-tête / Hero",
  services: "Services",
  logos: "Logos / Confiance",
  stats: "Chiffres clés",
  reviews: "Avis clients",
  gallery: "Galerie / Cartes",
  media: "Image / Média",
  statement: "Slogan / Valeurs",
  pricing: "Tarifs",
  faq: "FAQ",
  cta: "Appel à l'action",
  decor: "Ambiance / Décor",
  footer: "Pied de page",
  effets: "Effets divers",
};
const CATEGORY_ORDER = ["hero", "services", "logos", "stats", "reviews", "gallery", "media", "statement", "pricing", "faq", "cta", "decor", "footer", "effets"];

const RARITY: Record<Rarity, { label: string; bg: string; fg: string; dot: string }> = {
  common: { label: "Commun", bg: "#eef1e7", fg: "#5d6b3f", dot: "#8e9867" },
  rare: { label: "Rare", bg: "#f8e3da", fg: "#b15c3c", dot: "#e1937d" },
  epic: { label: "Épique", bg: "#f3e6c6", fg: "#8a5a14", dot: "#d8a23a" },
};

// Rareté + catégorie des effets lib/effects (jugement humain), pour les fondre au catalogue.
const EFFECT_META: Record<string, { role: string; rarity: Rarity }> = {
  "circular-testimonials": { role: "reviews", rarity: "rare" },
  "stagger-testimonials": { role: "reviews", rarity: "rare" },
  "shuffle-testimonials": { role: "reviews", rarity: "rare" },
  "display-cards": { role: "gallery", rarity: "rare" },
  "parallax-image": { role: "media", rarity: "rare" },
  "container-scroll": { role: "media", rarity: "epic" },
  "soft-glow": { role: "decor", rarity: "rare" },
  "floating-tags": { role: "statement", rarity: "rare" },
};

type ItemType = "section" | "effet";
interface CatalogItem {
  id: string;
  name: string;
  description: string;
  role: string;
  rarity: Rarity;
  type: ItemType;
  previewSrc: string;
  whenToUse: string[];
}

const TYPE_CHIP: Record<ItemType, { label: string; bg: string; fg: string }> = {
  section: { label: "Section", bg: "#eef0f4", fg: "#475569" },
  effet: { label: "Effet", bg: "#ece9fb", fg: "#6d4aff" },
};

function prettyName(id: string): string {
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildItems(): CatalogItem[] {
  const sections: CatalogItem[] = listManifests().map((m) => ({
    id: m.id,
    name: prettyName(m.id),
    description: m.description,
    role: m.role,
    rarity: m.rarity,
    type: "section",
    previewSrc: `/foundry-preview/${m.id}`,
    whenToUse: m.whenToUse,
  }));
  const effets: CatalogItem[] = listEffects().map((e) => {
    const meta = EFFECT_META[e.id] ?? { role: "effets", rarity: "rare" as Rarity };
    return {
      id: e.id,
      name: e.name,
      description: e.description,
      role: meta.role,
      rarity: meta.rarity,
      type: "effet",
      previewSrc: `/api/fx-demo?id=${e.id}`,
      whenToUse: [],
    };
  });
  return [...sections, ...effets];
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
        <span className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: t.bg, color: t.fg }}>
          {t.label}
        </span>
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

export default function ComposantsPage() {
  const all = buildItems();
  const byCat = new Map<string, CatalogItem[]>();
  for (const it of all) {
    const list = byCat.get(it.role) ?? [];
    list.push(it);
    byCat.set(it.role, list);
  }
  const cats = [
    ...CATEGORY_ORDER.filter((c) => byCat.has(c)),
    ...[...byCat.keys()].filter((c) => !CATEGORY_ORDER.includes(c)).sort(),
  ];
  const counts = {
    common: all.filter((m) => m.rarity === "common").length,
    rare: all.filter((m) => m.rarity === "rare").length,
    epic: all.filter((m) => m.rarity === "epic").length,
  };
  const nSections = all.filter((m) => m.type === "section").length;
  const nEffets = all.filter((m) => m.type === "effet").length;

  return (
    <div className="mx-auto max-w-[1280px] px-1 py-2">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Composants</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {all.length} pièces · {nSections} sections + {nEffets} effets · {cats.length} catégories. Les
          briques que l'IA assemble — chacune avec un aperçu réel.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {(["common", "rare", "epic"] as Rarity[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold" style={{ background: RARITY[k].bg, color: RARITY[k].fg }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: RARITY[k].dot }} />
              {RARITY[k].label} · {counts[k]}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold" style={{ background: TYPE_CHIP.section.bg, color: TYPE_CHIP.section.fg }}>Section · remplace une section</span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold" style={{ background: TYPE_CHIP.effet.bg, color: TYPE_CHIP.effet.fg }}>Effet · s'ajoute à une section</span>
        </div>
      </header>

      {cats.map((cat) => {
        const items = byCat.get(cat)!;
        return (
          <section key={cat} className="mb-10">
            <div className="mb-4 flex items-baseline gap-3 border-b border-black/10 pb-2">
              <h2 className="text-lg font-semibold text-neutral-900">{CATEGORY_LABEL[cat] ?? cat}</h2>
              <span className="text-sm text-neutral-400">{items.length} forme{items.length > 1 ? "s" : ""}</span>
            </div>
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))" }}>
              {items.map((it) => (
                <Card key={`${it.type}-${it.id}`} it={it} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
