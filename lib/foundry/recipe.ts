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
    if (vibeOk && !m.vibes.includes(recipe.vibe)) {
      errors.push(`[${i}] ${s.component} : non testé pour la vibe ${recipe.vibe}`);
    }
    for (const k of m.contentKeys) {
      if (!(k in s.content)) errors.push(`[${i}] ${s.component} : contenu manquant '${k}'`);
    }
    const skin = s.skin ?? {};
    for (const k of Object.keys(skin)) {
      if (!m.allowedSkinKeys.includes(k as SkinKey)) {
        errors.push(`[${i}] ${s.component} : skin '${k}' non autorisé`);
      }
    }
    resolved.push({ manifest: m, content: s.content, skin });
  });

  return { ok: errors.length === 0, errors, resolved };
}
