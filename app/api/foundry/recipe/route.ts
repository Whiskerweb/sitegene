import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getManifest } from "@/lib/foundry/manifests";
import { componentPrice } from "@/lib/marketplace";
import { ownedItems } from "@/lib/marketplace-server";
import { normalizeSectionContent, sanitizeUserContent, adaptContent } from "@/lib/foundry/agenceur";
import { repairCharte } from "@/lib/foundry/charte";
import { getVibe } from "@/lib/foundry/vibes";
import { validateRecipe, pinExtremes } from "@/lib/foundry/recipe";
import type { VibeId } from "@/lib/foundry/types";
import {
  FOUNDRY_TEMPLATE_ID,
  acquiredFromSnapshot,
  loadRecipeDraft,
  pagesFromSnapshot,
  saveSitePages,
  saveRecipeDraft,
} from "@/lib/foundry/server";

const MIN_SECTIONS = 4;
const HEX = /^#[0-9a-fA-F]{6}$/;
const OPS = ["swap", "add", "remove", "reorder", "content", "palette", "set", "brand"];

/** brand = {primary?, logo?, logoScale?} compact (undefined si vide) — réutilisé par palette/set/brand.
 *  logoScale n'est stocké que s'il y a un logo ET qu'il diffère de 1 (recette propre). */
function makeBrand(
  primary?: string,
  logo?: string,
  logoScale?: number,
): { primary?: string; logo?: string; logoScale?: number } | undefined {
  const b: { primary?: string; logo?: string; logoScale?: number } = {};
  if (primary) b.primary = primary;
  if (logo) b.logo = logo;
  if (logo && typeof logoScale === "number" && Number.isFinite(logoScale) && logoScale !== 1) b.logoScale = logoScale;
  return Object.keys(b).length ? b : undefined;
}

/** URL de logo acceptée : un objet public de NOTRE bucket, dans le dossier du site
 *  (atelier) ou en staging (onboarding adopté). Empêche d'injecter une URL tierce. */
function isAllowedLogoUrl(url: unknown, siteId: string): url is string {
  if (typeof url !== "string" || url.length > 600) return false;
  const m = url.match(/\/storage\/v1\/object\/public\/site-photos\/([^?#]+)$/i);
  if (!m) return false;
  const path = decodeURIComponent(m[1]);
  return path.startsWith(`${siteId}/`) || path.startsWith("staging/");
}

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
  // pageId : on édite les sections d'une SOUS-PAGE (sinon l'accueil). La palette
  // reste globale (charte partagée) — pageId ignoré pour 'palette'.
  const pageId = typeof body?.pageId === "string" ? body.pageId : "";
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

  // Cible de l'édition de sections : une sous-page (pageId) ou l'accueil.
  // La palette est globale → jamais portée par une page.
  const editingPage = pageId && op !== "palette" ? pagesFromSnapshot(draft.row).find((p) => p.id === pageId) ?? null : null;
  if (pageId && op !== "palette" && !editingPage) {
    return NextResponse.json({ error: "Page introuvable." }, { status: 404 });
  }
  const onPage = !!editingPage;
  const minSections = onPage ? 1 : MIN_SECTIONS; // une sous-page peut être courte
  const sections = [...(editingPage ? editingPage.sections : recipe.sections)];

  /** Persiste les sections travaillées (sous-page ou accueil) + renvoie la réponse. */
  async function persistSections(workSections: typeof sections) {
    const pinned = pinExtremes(workSections); // navbar/footer hérités → no-op sur une page
    if (editingPage) {
      const pages = pagesFromSnapshot(draft!.row).map((p) =>
        p.id === editingPage!.id ? { ...editingPage!, sections: pinned } : p,
      );
      // Valide la recette COMPOSÉE (accueil + page) pour rester sûr.
      const v = validateRecipe({ ...recipe, sections: pinned });
      if (!v.ok) return NextResponse.json({ error: "Opération impossible." }, { status: 500 });
      await saveSitePages(admin, siteId, pages);
    } else {
      const next = { ...recipe, sections: pinned };
      const v = validateRecipe(next);
      if (!v.ok) {
        console.error("[foundry/recipe] recette invalide après op", op, v.errors);
        return NextResponse.json({ error: "Opération impossible." }, { status: 500 });
      }
      await saveRecipeDraft(admin, siteId, next);
    }
    return NextResponse.json({
      ok: true,
      sections: pinned.map((s) => ({ component: s.component, content: s.content })),
    });
  }

  // --- Set : restaure un état complet (annuler / rétablir) -------------------
  if (op === "set") {
    const rawSections = Array.isArray(body?.sections) ? body.sections : null;
    if (!rawSections) return NextResponse.json({ error: "État invalide." }, { status: 400 });
    // N'autorise QUE des composants déjà acquis (un undo/redo ne traverse que des
    // états déjà atteints) — un set ne peut pas introduire une pièce non payée.
    const acquired = new Set([...recipe.sections.map((s) => s.component), ...sections.map((s) => s.component), ...acquiredFromSnapshot(draft.row)]);
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
    // En mode page : on restaure les sections de la page. Sinon, l'accueil + sa charte.
    if (editingPage) return persistSections(rebuilt);
    let next = { ...recipe, sections: rebuilt };
    if (body?.charteSpec && typeof body.charteSpec === "object") {
      next = { ...next, vibe: "custom", customVibe: repairCharte(body.charteSpec) };
    } else if (typeof body?.vibeId === "string" && getVibe(body.vibeId)) {
      next = { ...next, vibe: getVibe(body.vibeId)!.id as VibeId, customVibe: undefined };
    }
    // Préserve le logo de marque (recipe.brand.logo + échelle) à travers undo/redo :
    // seul l'accent change ici, le logo ne fait pas partie de l'historique couleur.
    next = { ...next, brand: makeBrand(typeof body?.accent === "string" && HEX.test(body.accent.trim()) ? body.accent.trim() : undefined, recipe.brand?.logo, recipe.brand?.logoScale) };
    next = { ...next, sections: pinExtremes(next.sections) };
    const v = validateRecipe(next);
    if (!v.ok) return NextResponse.json({ error: "État invalide." }, { status: 400 });
    await saveRecipeDraft(admin, siteId, next);
    return NextResponse.json({
      ok: true,
      sections: next.sections.map((s: { component: string; content: Record<string, unknown> }) => ({ component: s.component, content: s.content })),
    });
  }

  // --- Palette : change la DA sans toucher aux sections ----------------------
  if (op === "palette") {
    let next = recipe;
    if (body?.charteSpec && typeof body.charteSpec === "object") {
      // Charte sur mesure : TOUJOURS re-réparée serveur (contraste, fonts).
      // `userCharteId` (optionnel) garde le lien vers une charte ENREGISTRÉE du
      // compte → l'éditeur saura qu'« enregistrer » met à jour (pas un doublon).
      const vibe = repairCharte(body.charteSpec);
      const userCharteId = typeof body?.userCharteId === "string" && body.userCharteId ? body.userCharteId : undefined;
      next = { ...recipe, vibe: "custom", customVibe: vibe, userCharteId };
    } else if (typeof body?.vibeId === "string" && getVibe(body.vibeId)) {
      // Preset de base → on rompt le lien avec une éventuelle charte enregistrée.
      next = { ...recipe, vibe: getVibe(body.vibeId)!.id as VibeId, customVibe: undefined, userCharteId: undefined };
    } else {
      return NextResponse.json({ error: "Charte invalide." }, { status: 400 });
    }
    // L'accent de marque est TOUJOURS réinitialisé d'après `accent` (comme l'op
    // `set`) : choisir un preset SANS accent efface l'ancienne surcharge, sinon
    // l'accent figé masquerait la couleur du nouveau preset (« aucune différence »).
    // Le LOGO (et son échelle), lui, est conservé : il survit aux changements de charte.
    next = { ...next, brand: makeBrand(typeof body?.accent === "string" && HEX.test(body.accent.trim()) ? body.accent.trim() : undefined, recipe.brand?.logo, recipe.brand?.logoScale) };
    await saveRecipeDraft(admin, siteId, next);
    const effective = next.customVibe ?? getVibe(next.vibe)!;
    return NextResponse.json({ ok: true, vibe: effective, brandPrimary: next.brand?.primary ?? null });
  }

  // --- Brand : ajoute / remplace / retire le LOGO + règle sa taille ----------
  if (op === "brand") {
    const cur = recipe.brand ?? {};
    // logo : présent dans le body → on le change (ou on le retire si null/""), sinon inchangé.
    let logo = cur.logo;
    if ("logo" in body) {
      const raw = body.logo;
      if (raw === null || raw === "") logo = undefined;
      else if (isAllowedLogoUrl(raw, siteId)) logo = raw.trim();
      else return NextResponse.json({ error: "Logo invalide." }, { status: 400 });
    }
    // scale : présent dans le body → on le règle (borné 0.5–2.5), sinon inchangé.
    let scale = cur.logoScale;
    if (body?.scale !== undefined) {
      const n = Number(body.scale);
      if (!Number.isFinite(n)) return NextResponse.json({ error: "Taille invalide." }, { status: 400 });
      scale = Math.max(0.5, Math.min(2.5, n));
    }
    const next = { ...recipe, brand: makeBrand(cur.primary, logo, logo ? scale : undefined) };
    await saveRecipeDraft(admin, siteId, next);
    return NextResponse.json({ ok: true, logo: logo ?? null, scale: logo ? scale ?? 1 : 1 });
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
      return NextResponse.json({ ok: true, unchanged: true });
    }
    // Report SÉMANTIQUE : le titre/texte/images de la section en place
    // alimentent la nouvelle pièce, même si les clés diffèrent.
    sections[index] = { component: componentId, content: adaptContent(componentId, target.content) };
  }

  if (op === "add") {
    const manifest = getManifest(componentId)!;
    if (onPage && (manifest.role === "navbar" || manifest.role === "footer" || manifest.role === "hero")) {
      return NextResponse.json(
        { error: "L'en-tête, le pied de page et le hero appartiennent à l'Accueil — une sous-page commence par un bloc de contenu." },
        { status: 400 },
      );
    }
    if (sections.some((s) => getManifest(s.component)?.role === manifest.role)) {
      return NextResponse.json(
        { error: "Cette page a déjà une section de ce type — utilisez « Remplacer »." },
        { status: 409 },
      );
    }
    const at = index >= 0 && index <= sections.length ? index : sections.length;
    sections.splice(at, 0, { component: componentId, content: normalizeSectionContent(componentId, {}) });
  }

  if (op === "remove") {
    const target = sections[index];
    if (!target) return NextResponse.json({ error: "Section introuvable." }, { status: 400 });
    const role = getManifest(target.component)?.role;
    // Sur l'accueil, hero et footer sont l'identité du site. Sur une sous-page
    // ils n'ont pas leur place : on laisse retirer un hero hérité d'avant.
    if (!onPage && (role === "hero" || role === "footer")) {
      return NextResponse.json({ error: "Le hero et le footer ne se retirent pas." }, { status: 400 });
    }
    if (sections.length <= minSections) {
      return NextResponse.json({ error: "Cette page est déjà au minimum de sections." }, { status: 400 });
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
    // Le client personnalise la section → on retire le badge « données d'exemple ».
    const { meta: _wasPlaceholder, ...kept } = target;
    void _wasPlaceholder;
    sections[index] = { ...kept, content: sanitizeUserContent(target.component, body.content) };
  }

  // Persiste (sous-page ou accueil) avec invariants de position + renvoie les
  // sections effectives pour aligner l'éditeur.
  return persistSections(sections);
}
