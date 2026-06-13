// lib/foundry/reviews.ts
// Politique d'avis clients (déterministe, post-injection) :
//  - hasReviews === false → on RETIRE toute section de rôle "reviews".
//  - avis importés → on remplit la section avis avec eux (mapping adaptatif :
//    les composants avis n'ont pas tous la même forme d'item — text|quote|body,
//    name+role séparés ou author|by combinés).
// Pur : ne mute pas l'entrée.
import type { Recipe, RecipeSection } from "./types";
import type { Collected, ReviewItem } from "./link-catalog";
import { getManifest } from "./manifests";
import { getSample } from "./samples";

function roleOf(s: RecipeSection): string {
  return getManifest(s.component)?.role ?? "";
}

function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

/**
 * Construit les items d'une section avis à partir des avis importés, en calant
 * la FORME sur le sample du composant (clés text/auteur, avatar si présent).
 */
function reviewsToItems(componentId: string, reviews: ReviewItem[]): Record<string, unknown>[] {
  const sample = getSample(componentId);
  const sampleItems = Array.isArray(sample.items) ? (sample.items as unknown[]).filter(isObj) : [];
  const ref = (sampleItems[0] ?? {}) as Record<string, unknown>;
  const keys = Object.keys(ref);

  const textKey = keys.find((k) => /^(text|quote|body)$/i.test(k)) ?? "text";
  const hasName = keys.includes("name");
  const hasRole = keys.includes("role");
  const combinedKey = keys.find((k) => /^(author|by)$/i.test(k));
  const avatars = sampleItems
    .map((it) => it.avatar)
    .filter((a): a is string => typeof a === "string" && !!a);

  return reviews.slice(0, 12).map((r, i) => {
    const name = (r.name || "Client").slice(0, 60);
    const role = (r.role || "").slice(0, 80);
    const out: Record<string, unknown> = { [textKey]: r.text.slice(0, 600) };
    if (hasName) {
      out.name = name;
      if (hasRole) out.role = role;
    } else if (combinedKey) {
      out[combinedKey] = role ? `${name} — ${role}` : name;
    } else {
      out.name = name;
    }
    if (avatars.length) out.avatar = avatars[i % avatars.length];
    return out;
  });
}

/**
 * Applique la politique d'avis à une recette (après injectContacts).
 *  - hasReviews === false : retire les sections de rôle "reviews".
 *  - avis fournis : remplit leurs items.
 * Sinon : recette inchangée (la section reste en exemple → marquée placeholder).
 */
export function applyReviewsPolicy(recipe: Recipe, collected: Collected): Recipe {
  if (collected.hasReviews === false) {
    return { ...recipe, sections: recipe.sections.filter((s) => roleOf(s) !== "reviews") };
  }
  const reviews = collected.reviews?.filter((r) => r && typeof r.text === "string" && r.text.trim());
  if (!reviews || reviews.length === 0) return recipe;
  const sections = recipe.sections.map((s) =>
    roleOf(s) === "reviews"
      ? { ...s, content: { ...s.content, items: reviewsToItems(s.component, reviews) } }
      : s,
  );
  return { ...recipe, sections };
}
