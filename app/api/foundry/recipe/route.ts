import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getManifest } from "@/lib/foundry/manifests";
import { componentPrice } from "@/lib/marketplace";
import { ownedItems } from "@/lib/marketplace-server";
import { normalizeSectionContent } from "@/lib/foundry/agenceur";
import { validateRecipe } from "@/lib/foundry/recipe";
import {
  FOUNDRY_TEMPLATE_ID,
  loadRecipeDraft,
  recipeCards,
  saveRecipeDraft,
} from "@/lib/foundry/server";

const MIN_SECTIONS = 4;

/**
 * Plug-and-play sur la recette du site assemblé :
 *  - swap   : remplace la section `index` par un composant du MÊME rôle
 *  - add    : insère un composant dont le rôle est absent (avant le footer)
 *  - remove : retire la section `index` (hero et footer protégés)
 * Les composants rare/epic doivent être possédés — ceux déjà livrés dans le
 * site comptent comme possédés (ils sont inclus à la génération).
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const siteId = typeof body?.siteId === "string" ? body.siteId : "";
  const op = typeof body?.op === "string" ? body.op : "";
  const index = Number.isInteger(body?.index) ? (body.index as number) : -1;
  const componentId = typeof body?.componentId === "string" ? body.componentId : "";
  if (!siteId || !["swap", "add", "remove"].includes(op)) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, owner_user_id, template_id")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || site.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Site non autorisé." }, { status: 403 });
  }
  if (site.template_id !== FOUNDRY_TEMPLATE_ID) {
    return NextResponse.json({ error: "Ce site n'est pas un site assemblé." }, { status: 400 });
  }

  const draft = await loadRecipeDraft(admin, siteId);
  if (!draft) return NextResponse.json({ error: "Recette introuvable." }, { status: 404 });
  const recipe = draft.recipe;
  const sections = [...recipe.sections];

  // --- Gating d'achat (rare/epic non livrés avec le site) -------------------
  if (op === "swap" || op === "add") {
    const manifest = getManifest(componentId);
    if (!manifest) return NextResponse.json({ error: "Composant inconnu." }, { status: 400 });
    const price = componentPrice(manifest.rarity);
    if (price > 0) {
      const delivered = sections.some((s) => s.component === componentId);
      if (!delivered) {
        const owned = await ownedItems(admin, user.id);
        if (!owned.components.has(componentId)) {
          return NextResponse.json(
            { error: "Composant non débloqué.", needPurchase: true, componentId, rarity: manifest.rarity, price },
            { status: 402 },
          );
        }
      }
    }
  }

  if (op === "swap") {
    const target = sections[index];
    if (!target) return NextResponse.json({ error: "Section introuvable." }, { status: 400 });
    const oldManifest = getManifest(target.component)!;
    const newManifest = getManifest(componentId)!;
    if (newManifest.role !== oldManifest.role) {
      return NextResponse.json(
        { error: `Un composant « ${oldManifest.role} » ne peut être remplacé que par un composant du même rôle.` },
        { status: 400 },
      );
    }
    if (newManifest.id === target.component) {
      return NextResponse.json({ ok: true, unchanged: true, cards: recipeCards(recipe) });
    }
    // Le contenu compatible suit (mêmes clés/formes) ; le reste vient du sample.
    sections[index] = { component: componentId, content: normalizeSectionContent(componentId, target.content) };
  }

  if (op === "add") {
    const manifest = getManifest(componentId)!;
    if (sections.some((s) => getManifest(s.component)?.role === manifest.role)) {
      return NextResponse.json(
        { error: "Votre site a déjà une section de ce type — utilisez « Remplacer »." },
        { status: 409 },
      );
    }
    const at = index >= 1 && index < sections.length ? index : Math.max(1, sections.length - 1);
    sections.splice(at, 0, { component: componentId, content: normalizeSectionContent(componentId, {}) });
  }

  if (op === "remove") {
    const target = sections[index];
    if (!target) return NextResponse.json({ error: "Section introuvable." }, { status: 400 });
    const role = getManifest(target.component)?.role;
    if (role === "hero" || role === "footer") {
      return NextResponse.json({ error: "Le hero et le footer ne se retirent pas." }, { status: 400 });
    }
    if (sections.length <= MIN_SECTIONS) {
      return NextResponse.json({ error: "Votre site est déjà au minimum de sections." }, { status: 400 });
    }
    sections.splice(index, 1);
  }

  const next = { ...recipe, sections };
  const v = validateRecipe(next);
  if (!v.ok) {
    console.error("[foundry/recipe] recette invalide après op", op, v.errors);
    return NextResponse.json({ error: "Opération impossible." }, { status: 500 });
  }

  await saveRecipeDraft(admin, siteId, next);
  return NextResponse.json({ ok: true, cards: recipeCards(next) });
}
