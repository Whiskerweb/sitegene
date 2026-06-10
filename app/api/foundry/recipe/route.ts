import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getManifest } from "@/lib/foundry/manifests";
import { componentPrice } from "@/lib/marketplace";
import { ownedItems } from "@/lib/marketplace-server";
import { normalizeSectionContent, sanitizeUserContent } from "@/lib/foundry/agenceur";
import { repairCharte } from "@/lib/foundry/charte";
import { getVibe } from "@/lib/foundry/vibes";
import { validateRecipe, pinExtremes } from "@/lib/foundry/recipe";
import type { VibeId } from "@/lib/foundry/types";
import {
  FOUNDRY_TEMPLATE_ID,
  acquiredFromSnapshot,
  loadRecipeDraft,
  recipeCards,
  saveRecipeDraft,
} from "@/lib/foundry/server";

const MIN_SECTIONS = 4;
const HEX = /^#[0-9a-fA-F]{6}$/;
const OPS = ["swap", "add", "remove", "reorder", "content", "palette", "set"];

/**
 * Plug-and-play sur la recette du site assemblé (éditeur visuel « L'Atelier ») :
 *  - swap    : remplace la section `index` par un composant du MÊME rôle
 *  - add     : insère un composant dont le rôle est absent (avant le footer)
 *  - remove  : retire la section `index` (hero et footer protégés)
 *  - reorder : déplace la section `from` vers `to` (libre, façon Canva)
 *  - content : remplace le contenu de `index` (textes + images édités à la main)
 *  - palette : change la direction artistique (preset ou charte sur mesure), live
 * swap/add gating d'achat (rare/epic non livrés/possédés) ; reorder/content/palette
 * n'introduisent aucun composant → pas de gating.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const siteId = typeof body?.siteId === "string" ? body.siteId : "";
  const op = typeof body?.op === "string" ? body.op : "";
  const index = Number.isInteger(body?.index) ? (body.index as number) : -1;
  const componentId = typeof body?.componentId === "string" ? body.componentId : "";
  if (!siteId || !OPS.includes(op)) {
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

  // --- Set : restaure un état complet (annuler / rétablir) -------------------
  if (op === "set") {
    const rawSections = Array.isArray(body?.sections) ? body.sections : null;
    if (!rawSections) return NextResponse.json({ error: "État invalide." }, { status: 400 });
    // N'autorise QUE des composants déjà acquis (un undo/redo ne traverse que des
    // états déjà atteints) — un set ne peut pas introduire une pièce non payée.
    const acquired = new Set([...sections.map((s) => s.component), ...acquiredFromSnapshot(draft.row)]);
    const owned = await ownedItems(admin, user.id);
    const rebuilt = rawSections
      .filter((s: unknown) => s && typeof (s as { component?: unknown }).component === "string")
      .map((s: { component: string; content?: unknown }) => ({ component: s.component, content: sanitizeUserContent(s.component, s.content) }));
    for (const s of rebuilt) {
      const m = getManifest(s.component);
      if (!m) return NextResponse.json({ error: "Composant inconnu." }, { status: 400 });
      if (componentPrice(m.rarity) > 0 && !acquired.has(s.component) && !owned.components.has(s.component)) {
        return NextResponse.json({ error: "État non autorisé." }, { status: 402 });
      }
    }
    let next = { ...recipe, sections: rebuilt };
    if (body?.charteSpec && typeof body.charteSpec === "object") {
      next = { ...next, vibe: "custom", customVibe: repairCharte(body.charteSpec) };
    } else if (typeof body?.vibeId === "string" && getVibe(body.vibeId)) {
      next = { ...next, vibe: getVibe(body.vibeId)!.id as VibeId, customVibe: undefined };
    }
    next = { ...next, brand: typeof body?.accent === "string" && HEX.test(body.accent.trim()) ? { primary: body.accent.trim() } : undefined };
    next = { ...next, sections: pinExtremes(next.sections) };
    const v = validateRecipe(next);
    if (!v.ok) return NextResponse.json({ error: "État invalide." }, { status: 400 });
    await saveRecipeDraft(admin, siteId, next);
    return NextResponse.json({
      ok: true,
      cards: recipeCards(next),
      sections: next.sections.map((s: { component: string; content: Record<string, unknown> }) => ({ component: s.component, content: s.content })),
    });
  }

  // --- Palette : change la DA sans toucher aux sections ----------------------
  if (op === "palette") {
    let next = recipe;
    if (body?.charteSpec && typeof body.charteSpec === "object") {
      // Charte sur mesure : TOUJOURS re-réparée serveur (contraste, fonts).
      const vibe = repairCharte(body.charteSpec);
      next = { ...recipe, vibe: "custom", customVibe: vibe };
    } else if (typeof body?.vibeId === "string" && getVibe(body.vibeId)) {
      next = { ...recipe, vibe: getVibe(body.vibeId)!.id as VibeId, customVibe: undefined };
    } else {
      return NextResponse.json({ error: "Charte invalide." }, { status: 400 });
    }
    if (typeof body?.accent === "string") {
      next = { ...next, brand: HEX.test(body.accent.trim()) ? { primary: body.accent.trim() } : undefined };
    }
    await saveRecipeDraft(admin, siteId, next);
    const effective = next.customVibe ?? getVibe(next.vibe)!;
    return NextResponse.json({ ok: true, vibe: effective, brandPrimary: next.brand?.primary ?? null });
  }

  // --- Gating d'achat (rare/epic jamais acquis pour ce site) ----------------
  if (op === "swap" || op === "add") {
    const manifest = getManifest(componentId);
    if (!manifest) return NextResponse.json({ error: "Composant inconnu." }, { status: 400 });
    const price = componentPrice(manifest.rarity);
    if (price > 0) {
      // Acquis = déjà dans la recette OU enregistré comme acquis (livré/payé un
      // jour pour ce site) OU possédé sur le compte. Empêche de re-payer une
      // pièce de base qu'on a retirée puis voulu remettre.
      const acquired = new Set([...sections.map((s) => s.component), ...acquiredFromSnapshot(draft.row)]);
      if (!acquired.has(componentId)) {
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
    // Le contenu du client suit (textes ET images, clés compatibles) ; le reste
    // vient du sample. La nouvelle pièce arrive donc avec les infos du site.
    sections[index] = { component: componentId, content: sanitizeUserContent(componentId, target.content) };
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

  if (op === "reorder") {
    const from = index;
    const to = Number.isInteger(body?.to) ? (body.to as number) : -1;
    if (from < 0 || from >= sections.length || to < 0 || to >= sections.length) {
      return NextResponse.json({ error: "Position invalide." }, { status: 400 });
    }
    const [moved] = sections.splice(from, 1);
    sections.splice(to, 0, moved);
  }

  if (op === "content") {
    const target = sections[index];
    if (!target) return NextResponse.json({ error: "Section introuvable." }, { status: 400 });
    if (!body?.content || typeof body.content !== "object") {
      return NextResponse.json({ error: "Contenu invalide." }, { status: 400 });
    }
    // Édition manuelle : on PRÉSERVE textes ET images du client (pas la banque).
    sections[index] = { ...target, content: sanitizeUserContent(target.component, body.content) };
  }

  // Invariants de position (navbar en tête, footer en queue) après toute op.
  const next = { ...recipe, sections: pinExtremes(sections) };
  const v = validateRecipe(next);
  if (!v.ok) {
    console.error("[foundry/recipe] recette invalide après op", op, v.errors);
    return NextResponse.json({ error: "Opération impossible." }, { status: 500 });
  }

  await saveRecipeDraft(admin, siteId, next);
  // Renvoie aussi les sections (component + content effectif) pour que l'éditeur
  // reste exactement aligné sur ce qui est persisté (ordre épinglé + contenu).
  return NextResponse.json({
    ok: true,
    cards: recipeCards(next),
    sections: next.sections.map((s) => ({ component: s.component, content: s.content })),
  });
}
