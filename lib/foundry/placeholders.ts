// lib/foundry/placeholders.ts
// Marque les sections qui tournent sur des données INVENTÉES / d'exemple — celles
// que Mistral pose « à remplir plus tard » : avis fictifs, chiffres plausibles,
// galerie de photos de banque. L'aperçu et l'éditeur les entourent d'un cadre +
// un badge « personnalisable en 30 s » ; le site PUBLIÉ les ignore (Assembler
// sans placeholderMode). Pur, idempotent : recalcule meta à chaque passe.
import type { Recipe, RecipeSection, SectionMeta } from "./types";
import type { Collected } from "./link-catalog";
import { getManifest } from "./manifests";

function roleOf(s: RecipeSection): string {
  return getManifest(s.component)?.role ?? "";
}

/** Une image est « réelle » (uploadée par le client) si elle pointe vers le storage du site. */
const UPLOAD_RE = /\/storage\/v1\/object\/public\/site-photos\//;
function hasUploadedImage(s: RecipeSection): boolean {
  const urls: string[] = [];
  for (const v of Object.values(s.content)) {
    if (typeof v === "string") urls.push(v);
    else if (Array.isArray(v)) for (const x of v) if (typeof x === "string") urls.push(x);
  }
  return urls.some((u) => UPLOAD_RE.test(u));
}

/** Le badge à poser sur une section, ou undefined si elle porte de vraies données. */
function metaFor(s: RecipeSection, collected?: Collected): SectionMeta | undefined {
  switch (roleOf(s)) {
    case "reviews":
      if (collected?.reviews && collected.reviews.length > 0) return undefined;
      return { placeholder: true, reason: "Avis d'exemple — importez les vôtres en 30 s" };
    case "stats":
      return { placeholder: true, reason: "Chiffres d'exemple — ajustez-les en 30 s" };
    case "gallery":
      if (hasUploadedImage(s)) return undefined;
      return { placeholder: true, reason: "Visuels d'exemple — ajoutez vos photos en 30 s" };
    default:
      return undefined;
  }
}

/**
 * Pose (ou retire) le marqueur `placeholder` sur les sections d'une recette.
 * À appeler après génération (collected absent) puis après injection (collected
 * fourni) : la 2ᵉ passe efface les marqueurs des sections désormais remplies.
 */
export function markPlaceholders(recipe: Recipe, collected?: Collected): Recipe {
  const sections = recipe.sections.map((s) => {
    const meta = metaFor(s, collected);
    if (meta) return { ...s, meta };
    if (s.meta) {
      const next = { ...s };
      delete next.meta;
      return next;
    }
    return s;
  });
  return { ...recipe, sections };
}
