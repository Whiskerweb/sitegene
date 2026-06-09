// lib/foundry/recipe.ts
import { getVibe } from "./vibes";
import { getManifest } from "./manifests";
import type { Recipe, RecipeValidation, ResolvedSection, SkinKey } from "./types";

export function validateRecipe(recipe: Recipe): RecipeValidation {
  const errors: string[] = [];
  const resolved: ResolvedSection[] = [];
  const vibeOk = !!getVibe(recipe.vibe);
  if (!vibeOk) errors.push(`vibe inconnue : ${recipe.vibe}`);

  recipe.sections.forEach((s, i) => {
    const m = getManifest(s.component);
    if (!m) {
      errors.push(`composant inconnu [${i}] : ${s.component}`);
      return;
    }
    // Erreurs propres à CETTE section : si non vide, la section n'est pas résolue.
    const sectionErrors: string[] = [];
    if (vibeOk && !m.vibes.includes(recipe.vibe)) {
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
