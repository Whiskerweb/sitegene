// components/foundry/studio/load.ts
// Prépare le StudioData (serveur) pour L'Atelier : recette + charte effective,
// catalogue avec possession/prix, presets de vibes, fonts éditables, banque
// d'images du client. SERVEUR/admin uniquement.
import type { createAdminClient } from "@/lib/supabase/admin";
import { listManifests, getManifest } from "@/lib/foundry/manifests";
import { getSample } from "@/lib/foundry/samples";
import { listVibes, getVibe } from "@/lib/foundry/vibes";
import { roleLabel } from "@/lib/foundry/roles";
import { CHARTE_FONTS } from "@/lib/foundry/charte";
import { COMPONENT_PRICE_CREDITS } from "@/lib/marketplace";
import { ownedItems } from "@/lib/marketplace-server";
import { getBalance } from "@/lib/credits-server";
import { loadRecipeDraft, recipeCards } from "@/lib/foundry/server";
import { loadPublishedSnapshot } from "@/lib/site-content-store";
import { listSitePhotos } from "@/lib/site-photos";
import { COMPONENTS } from "@/components/foundry/registry";
import type { StudioData, StudioSection, CatalogEntry, StudioVibe } from "./types";

type Admin = ReturnType<typeof createAdminClient>;

export async function loadStudioData(
  admin: Admin,
  userId: string,
  site: { id: string; slug: string | null; status: string; billing_status: string | null },
  businessName: string,
): Promise<StudioData | null> {
  const draft = await loadRecipeDraft(admin, site.id);
  if (!draft) return null;
  const { recipe } = draft;

  const [owned, balance, published, photos] = await Promise.all([
    ownedItems(admin, userId),
    getBalance(admin, userId),
    loadPublishedSnapshot(admin, site.id),
    listSitePhotos(admin, site.id),
  ]);

  const cards = recipeCards(recipe);
  const sections: StudioSection[] = recipe.sections.map((s, i) => ({
    component: s.component,
    role: cards[i]?.role ?? getManifest(s.component)?.role ?? "section",
    roleLabel: cards[i]?.roleLabel ?? roleLabel(getManifest(s.component)?.role ?? "section"),
    rarity: cards[i]?.rarity ?? "common",
    content: s.content as Record<string, unknown>,
  }));

  // Catalogue : uniquement les pièces RENDABLES (présentes dans le registre).
  const deliveredIds = new Set(recipe.sections.map((s) => s.component));
  const catalog: CatalogEntry[] = listManifests()
    .filter((m) => COMPONENTS[m.id])
    .map((m) => {
      const price = COMPONENT_PRICE_CREDITS[m.rarity];
      return {
        id: m.id,
        label: prettyName(m.id),
        role: m.role,
        roleLabel: roleLabel(m.role),
        rarity: m.rarity,
        price,
        owned: price === 0 || owned.components.has(m.id) || deliveredIds.has(m.id),
        sample: getSample(m.id),
      };
    });

  const vibe: StudioVibe = recipe.customVibe ?? getVibe(recipe.vibe) ?? listVibes()[0];

  const isLive = site.status === "live" && !!site.slug;
  const billing = site.billing_status ?? "none";
  const locked = !isLive && ["none", "canceled", "payment_failed"].includes(billing);
  const hasUnpublished = !published || published.id !== draft.row.id;

  return {
    siteId: site.id,
    slug: site.slug,
    isLive,
    locked,
    hasUnpublished,
    balance,
    businessName,
    sections,
    vibe,
    brandPrimary: recipe.brand?.primary ?? null,
    catalog,
    presets: listVibes(),
    fonts: {
      heading: CHARTE_FONTS.filter((f) => f.roles.includes("heading")).map((f) => f.family),
      body: CHARTE_FONTS.filter((f) => f.roles.includes("body")).map((f) => f.family),
    },
    mediaBank: photos.map((p) => p.url),
  };
}

function prettyName(id: string): string {
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
