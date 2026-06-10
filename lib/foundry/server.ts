// lib/foundry/server.ts
// Persistance des sites ASSEMBLÉS (fonderie) — SERVEUR/admin uniquement.
// Un site assemblé = peau `foundry` du modèle « 1 site / N peaux » (0020) :
// la recette vit dans site_content.content_json.__recipe, le circuit
// snapshots/publication/facturation existant reste inchangé.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Recipe } from "./types";
import { getManifest } from "./manifests";
import { roleLabel } from "./roles";
import {
  loadEditableSnapshot,
  saveDraftSnapshot,
  type ContentRow,
} from "@/lib/site-content-store";

export const FOUNDRY_TEMPLATE_ID = "foundry";

/** Ligne templates 'foundry' (FK sites.template_id) — idempotent. */
export async function ensureFoundryTemplateRow(admin: SupabaseClient): Promise<void> {
  await admin.from("templates").upsert(
    { id: FOUNDRY_TEMPLATE_ID, name: "Site assemblé (fonderie)", version: "1" },
    { onConflict: "id", ignoreDuplicates: true },
  );
}

export interface FoundryContent {
  __recipe: Recipe;
  __brief?: string;
  __businessName?: string;
}

/** Extrait la recette d'un snapshot (null si le snapshot n'est pas une recette). */
export function recipeFromSnapshot(row: ContentRow | null): Recipe | null {
  const recipe = (row?.content_json as Partial<FoundryContent> | null)?.__recipe;
  if (!recipe || typeof recipe !== "object" || !Array.isArray(recipe.sections)) return null;
  return recipe as Recipe;
}

/** Sauvegarde la recette comme brouillon de la peau foundry. */
export async function saveRecipeDraft(
  admin: SupabaseClient,
  siteId: string,
  recipe: Recipe,
  meta: { brief?: string; businessName?: string } = {},
): Promise<number> {
  const existing = await loadEditableSnapshot(admin, siteId, FOUNDRY_TEMPLATE_ID);
  const prev = (existing?.content_json ?? {}) as Partial<FoundryContent>;
  const content: FoundryContent = {
    __recipe: recipe,
    __brief: meta.brief ?? prev.__brief,
    __businessName: meta.businessName ?? prev.__businessName,
  };
  return saveDraftSnapshot(admin, siteId, FOUNDRY_TEMPLATE_ID, content as unknown as Record<string, unknown>, "ai");
}

/** Recette éditable (brouillon) d'un site foundry. */
export async function loadRecipeDraft(
  admin: SupabaseClient,
  siteId: string,
): Promise<{ recipe: Recipe; row: ContentRow } | null> {
  const row = await loadEditableSnapshot(admin, siteId, FOUNDRY_TEMPLATE_ID);
  const recipe = recipeFromSnapshot(row);
  return recipe && row ? { recipe, row } : null;
}

export interface SectionCard {
  component: string;
  role: string;
  roleLabel: string;
  rarity: "common" | "rare" | "epic";
}

/** Cartes (rôle + rareté) d'une recette — alimente l'ouverture de booster + l'éditeur. */
export function recipeCards(recipe: Recipe): SectionCard[] {
  return recipe.sections.flatMap((s) => {
    const m = getManifest(s.component);
    return m ? [{ component: m.id, role: m.role, roleLabel: roleLabel(m.role), rarity: m.rarity }] : [];
  });
}
