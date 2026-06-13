import { notFound } from "next/navigation";
import { requireUser, getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import Assembler from "@/components/foundry/Assembler";
import { getManifest } from "@/lib/foundry/manifests";
import { getVibe } from "@/lib/foundry/vibes";
import { normalizeSectionContent } from "@/lib/foundry/agenceur";
import type { Recipe, VibeId } from "@/lib/foundry/types";
import {
  FOUNDRY_TEMPLATE_ID,
  loadRecipeDraft,
  pagesFromSnapshot,
  composePageRecipe,
} from "@/lib/foundry/server";

export const dynamic = "force-dynamic";

/**
 * Aperçu PROPRIÉTAIRE du site assemblé (brouillon) — servi dans les iframes du
 * reveal, du dashboard, de la marketplace et de l'aperçu responsive de
 * L'Atelier. Paramètres :
 *   ?page=<pageId> : aperçu d'une SOUS-PAGE (navbar + footer de l'accueil).
 *   ?swap=<componentId> : voir un composant SUR SON SITE (remplace la section
 *     du même rôle, sinon insertion avant le footer) — section surlignée.
 *   ?vibe=<vibeId>&accent=<hex> : essayer une autre direction artistique.
 */
export default async function SitePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ swap?: string; vibe?: string; accent?: string; page?: string }>;
}) {
  const user = await requireUser();
  const { siteId } = await params;
  const { swap, vibe, accent, page } = await searchParams;

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, owner_user_id, template_id")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || site.template_id !== FOUNDRY_TEMPLATE_ID) notFound();
  if (site.owner_user_id !== user.id) {
    const profile = await getProfile();
    if (!profile?.is_operator) notFound();
  }

  const draft = await loadRecipeDraft(admin, siteId);
  if (!draft) notFound();

  let recipe: Recipe = draft.recipe;
  let highlightIndex: number | undefined;

  // Aperçu d'une sous-page : ses sections entre la navbar et le footer de
  // l'accueil (page inconnue → on retombe sur l'accueil, jamais de 404).
  if (page) {
    const sub = pagesFromSnapshot(draft.row).find((p) => p.id === page);
    if (sub) recipe = composePageRecipe(recipe, sub);
  }

  // Essai d'une autre DA (sans toucher au brouillon).
  if (vibe && getVibe(vibe)) {
    const hex = accent && /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : undefined;
    recipe = { ...recipe, vibe: getVibe(vibe)!.id as VibeId, brand: hex ? { primary: hex } : undefined };
  }

  // « Voir sur mon site » : swap virtuel du composant candidat.
  const candidate = swap ? getManifest(swap) : undefined;
  if (candidate) {
    const sections = [...recipe.sections];
    const i = sections.findIndex((s) => getManifest(s.component)?.role === candidate.role);
    if (i >= 0) {
      sections[i] = {
        component: candidate.id,
        content: normalizeSectionContent(candidate.id, sections[i].content),
      };
      highlightIndex = i;
    } else {
      // Insertion selon le rôle : une navbar va TOUJOURS tout en haut, un footer
      // tout en bas, le reste juste avant le footer.
      const at =
        candidate.role === "navbar" ? 0
        : candidate.role === "footer" ? sections.length
        : Math.max(1, sections.length - 1);
      sections.splice(at, 0, { component: candidate.id, content: normalizeSectionContent(candidate.id, {}) });
      highlightIndex = at;
    }
    recipe = { ...recipe, sections };
  }

  // Aperçu PROPRIÉTAIRE : on entoure les sections d'exemple (avis/chiffres/
  // galerie) d'un badge « personnalisable en 30 s ». Jamais sur le site publié.
  return <Assembler recipe={recipe} highlightIndex={highlightIndex} placeholderMode />;
}
