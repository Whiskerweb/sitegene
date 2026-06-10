// lib/foundry/recipe.ts
import { getVibe } from "./vibes";
import { getManifest } from "./manifests";
import type { Recipe, RecipeSection, RecipeValidation, ResolvedSection, SkinKey } from "./types";

/**
 * Garantit les invariants de position : la navbar (si présente) toujours en
 * PREMIER — elle n'a pas d'autre place logique —, le footer toujours en DERNIER.
 * Idempotent : sûr à appeler après n'importe quelle opération d'édition.
 */
export function pinExtremes(sections: RecipeSection[]): RecipeSection[] {
  const arr = [...sections];
  const navIdx = arr.findIndex((s) => getManifest(s.component)?.role === "navbar");
  if (navIdx > 0) arr.unshift(arr.splice(navIdx, 1)[0]);
  const footIdx = arr.findIndex((s) => getManifest(s.component)?.role === "footer");
  if (footIdx !== -1 && footIdx !== arr.length - 1) arr.push(arr.splice(footIdx, 1)[0]);
  return arr;
}

export function validateRecipe(recipe: Recipe): RecipeValidation {
  const errors: string[] = [];
  const resolved: ResolvedSection[] = [];
  // Charte sur mesure embarquée (déjà réparée serveur) OU vibe curée connue.
  const custom = !!recipe.customVibe;
  const vibeOk = custom || !!getVibe(recipe.vibe);
  if (!vibeOk) errors.push(`vibe inconnue : ${recipe.vibe}`);

  recipe.sections.forEach((s, i) => {
    const m = getManifest(s.component);
    if (!m) {
      errors.push(`composant inconnu [${i}] : ${s.component}`);
      return;
    }
    // Erreurs propres à CETTE section : si non vide, la section n'est pas résolue.
    const sectionErrors: string[] = [];
    // Les composants sont pilotés par tokens : une charte custom vaut pour tous.
    if (vibeOk && !custom && !m.vibes.includes(recipe.vibe as never)) {
      sectionErrors.push(`[${i}] ${s.component} : non testé pour la vibe ${recipe.vibe}`);
    }
    for (const k of m.contentKeys) {
      if (!(k in s.content)) sectionErrors.push(`[${i}] ${s.component} : contenu manquant '${k}'`);
    }
    const skin = s.skin ?? {};
    for (const k of Object.keys(skin)) {
      if (!m.allowedSkinKeys.includes(k as SkinKey)) {
        sectionErrors.push(`[${i}] ${s.component} : skin '${k}' non autorisé`);
      }
    }
    errors.push(...sectionErrors);
    // `resolved` ne contient QUE des sections valides → sûr à consommer même si ok === false.
    if (sectionErrors.length === 0) resolved.push({ manifest: m, content: s.content, skin });
  });

  return { ok: errors.length === 0, errors, resolved };
}
