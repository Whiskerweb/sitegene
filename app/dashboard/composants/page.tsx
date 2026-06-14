import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBalance } from "@/lib/credits-server";
import { ownedItems } from "@/lib/marketplace-server";
import { COMPONENT_PRICE_CREDITS } from "@/lib/marketplace";
import { primarySiteForUser } from "@/lib/primary-site";
import { listManifests } from "@/lib/foundry/manifests";
import { listEffects } from "@/lib/effects";
import { FOUNDRY_TEMPLATE_ID, loadRecipeDraft } from "@/lib/foundry/server";
import CatalogBrowser, {
  type CatalogItem,
  type MarketContext,
  type Rarity,
} from "@/components/foundry/CatalogBrowser";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  navbar: "Navigation",
  hero: "En-tête / Hero",
  logos: "Logos / Confiance",
  about: "À propos",
  story: "Histoire",
  team: "Équipe",
  services: "Services",
  process: "Étapes / Process",
  stats: "Chiffres clés",
  reviews: "Avis clients",
  gallery: "Galerie / Cartes",
  media: "Image / Média",
  statement: "Slogan / Valeurs",
  highlights: "Points forts",
  pricing: "Tarifs",
  faq: "FAQ",
  contact: "Contact",
  cta: "Appel à l'action",
  decor: "Ambiance / Décor",
  footer: "Pied de page",
  effets: "Effets divers",
};
const CATEGORY_ORDER = [
  "navbar", "hero", "logos", "about", "story", "team", "services", "process", "stats",
  "reviews", "gallery", "media", "statement", "highlights", "pricing", "faq", "contact",
  "cta", "decor", "footer", "effets",
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

export default async function ComposantsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; swapIndex?: string }>;
}) {
  const user = await requireUser();
  const admin = createAdminClient();
  const sp = await searchParams;

  // Contexte marketplace : site assemblé du compte (aperçus personnalisés),
  // possession (achats + composants livrés dans la recette) et solde.
  const [site, owned, balance] = await Promise.all([
    primarySiteForUser<{ id: string; template_id: string | null }>(admin, user.id, "id, template_id"),
    ownedItems(admin, user.id),
    getBalance(admin, user.id),
  ]);
  const foundrySite = site?.template_id === FOUNDRY_TEMPLATE_ID ? site : null;
  const delivered = foundrySite
    ? ((await loadRecipeDraft(admin, foundrySite.id))?.recipe.sections.map((s) => s.component) ?? [])
    : [];

  const swapIndex = Number.parseInt(sp.swapIndex ?? "", 10);
  const market: MarketContext = {
    siteId: foundrySite?.id ?? null,
    owned: Array.from(new Set([...owned.components, ...delivered])),
    prices: COMPONENT_PRICE_CREDITS,
    balance,
    swap:
      foundrySite && sp.role && Number.isInteger(swapIndex)
        ? { index: swapIndex, role: sp.role }
        : null,
  };

  const all = buildItems();

  return (
    <div className="mx-auto max-w-[1280px] px-1 py-2">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Composants</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {foundrySite
            ? "Les communs sont inclus. Débloquez les rares et les épiques — et regardez chaque pièce sur votre site avant de choisir."
            : "Les pièces qui composent les sites Akyra, triées par section."}
        </p>
      </header>
      <CatalogBrowser
        items={all}
        categoryOrder={CATEGORY_ORDER}
        categoryLabel={CATEGORY_LABEL}
        market={market}
        initialCat={sp.role && CATEGORY_ORDER.includes(sp.role) ? sp.role : "all"}
      />
    </div>
  );
}
