import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBalance } from "@/lib/credits-server";
import { ownedItems } from "@/lib/marketplace-server";
import { listEffects } from "@/lib/effects";
import {
  ACTIVE_CATEGORIES,
  categoryForTemplate,
  getCategory,
  DEFAULT_CATEGORY,
} from "@/lib/categories";
import { TEMPLATE_IDS, isSpaTemplate, templateMeta } from "@/lib/templates";
import { EFFECT_PRICE_CREDITS, TEMPLATE_PRICE_CREDITS } from "@/lib/marketplace";
import { MarketplaceClient } from "./MarketplaceClient";

export const dynamic = "force-dynamic";

/**
 * Page Formules — la boutique en crédits : templates (la catégorie du client
 * d'abord) + effets (animations/composants à intégrer via l'éditeur IA).
 * RSC : charge solde, site, catégorie et ownership ; toute l'interactivité
 * (achats, modals, application) vit dans MarketplaceClient.
 */
export default async function MarketplacePage() {
  const user = await requireUser();
  const admin = createAdminClient();

  const [{ data: site }, owned, balance] = await Promise.all([
    admin
      .from("sites")
      .select("id, template_id")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    ownedItems(admin, user.id),
    getBalance(admin, user.id),
  ]);

  // Catégorie du client : intake d'onboarding, sinon déduite du template actuel.
  let intakeCategoryId: string | undefined;
  if (site) {
    const { data: ob } = await admin
      .from("site_onboarding")
      .select("intake")
      .eq("site_id", site.id)
      .maybeSingle();
    intakeCategoryId = (ob?.intake as { categoryId?: string } | null)?.categoryId;
  }
  const category =
    getCategory(intakeCategoryId ?? "") ??
    categoryForTemplate(site?.template_id ?? "") ??
    DEFAULT_CATEGORY;

  const tpl = (id: string, recommended: boolean) => {
    const cat = categoryForTemplate(id);
    return {
      id,
      ...templateMeta(id),
      owned: owned.templates.has(id),
      current: id === site?.template_id,
      recommended,
      categoryId: cat?.id ?? "autres",
      categoryLabel: cat?.label ?? "Autres",
    };
  };
  // Recommandés (catégorie du client) d'abord — c'est l'ordre « En avant ».
  const templates = [
    ...category.templateIds.map((id) => tpl(id, true)),
    ...TEMPLATE_IDS.filter(
      (id) => !(category.templateIds as readonly string[]).includes(id),
    ).map((id) => tpl(id, false)),
  ];
  const categories = [
    ...ACTIVE_CATEGORIES.map((c) => ({ id: c.id as string, label: c.label })),
    { id: "autres", label: "Autres" },
  ]
    .map((c) => ({ ...c, count: templates.filter((t) => t.categoryId === c.id).length }))
    .filter((c) => c.count > 0);

  const spaSite = !!site?.template_id && isSpaTemplate(site.template_id);
  const effects = listEffects().map((e) => ({
    id: e.id,
    name: e.name,
    description: e.description,
    owned: owned.effects.has(e.id),
    compatible: !spaSite || e.spaCompatible,
    accent: e.accent,
  }));

  return (
    <MarketplaceClient
      hasSite={!!site}
      balance={balance}
      categoryLabel={category.label}
      templatePrice={TEMPLATE_PRICE_CREDITS}
      effectPrice={EFFECT_PRICE_CREDITS}
      templates={templates}
      categories={categories}
      effects={effects}
    />
  );
}
