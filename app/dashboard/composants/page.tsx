import { listManifests } from "@/lib/foundry/manifests";
import { listEffects } from "@/lib/effects";
import CatalogBrowser, { type CatalogItem, type Rarity } from "@/components/foundry/CatalogBrowser";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  hero: "En-tête / Hero",
  logos: "Logos / Confiance",
  about: "À propos",
  services: "Services",
  process: "Étapes / Process",
  stats: "Chiffres clés",
  reviews: "Avis clients",
  gallery: "Galerie / Cartes",
  media: "Image / Média",
  statement: "Slogan / Valeurs",
  pricing: "Tarifs",
  faq: "FAQ",
  contact: "Contact",
  cta: "Appel à l'action",
  decor: "Ambiance / Décor",
  footer: "Pied de page",
  effets: "Effets divers",
};
const CATEGORY_ORDER = [
  "hero", "logos", "about", "services", "process", "stats", "reviews", "gallery",
  "media", "statement", "pricing", "faq", "contact", "cta", "decor", "footer", "effets",
];

// Rareté + catégorie des effets lib/effects (jugement humain), fondus au catalogue.
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

export default function ComposantsPage() {
  const all = buildItems();
  const counts = {
    common: all.filter((m) => m.rarity === "common").length,
    rare: all.filter((m) => m.rarity === "rare").length,
    epic: all.filter((m) => m.rarity === "epic").length,
  };
  const nSections = all.filter((m) => m.type === "section").length;
  const nEffets = all.filter((m) => m.type === "effet").length;
  const nCats = new Set(all.map((m) => m.role)).size;

  return (
    <div className="mx-auto max-w-[1280px] px-1 py-2">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Composants</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {all.length} pièces · {nSections} sections + {nEffets} effets · {nCats} catégories · {counts.common}{" "}
          communs / {counts.rare} rares / {counts.epic} épiques. Filtre par section, rareté ou type ; aperçu réel sous la DA « warm-serif ».
        </p>
      </header>
      <CatalogBrowser items={all} categoryOrder={CATEGORY_ORDER} categoryLabel={CATEGORY_LABEL} />
    </div>
  );
}
