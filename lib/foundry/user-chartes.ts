// lib/foundry/user-chartes.ts
// Chartes graphiques PERSONNELLES (table user_chartes) : un utilisateur enregistre
// ses propres DA sur son compte pour les réutiliser. Accès admin/serveur — la
// propriété est vérifiée dans les routes (getUser). Toute spec stockée est
// normalisée (repairCharte → vibeToSpec) : contrastes WCAG, fonts liste blanche.
import type { createAdminClient } from "@/lib/supabase/admin";
import { repairCharte, vibeToSpec, type CharteSpec } from "./charte";

type Admin = ReturnType<typeof createAdminClient>;

export interface SavedCharte {
  id: string;
  name: string;
  spec: CharteSpec;
}

/** Garde-fou : nombre max de chartes enregistrées par compte. */
export const MAX_USER_CHARTES = 50;

/** Normalise une spec brute (client) → CharteSpec sûre (réparée + ré-extraite). */
export function normalizeCharteSpec(raw: unknown): CharteSpec {
  return vibeToSpec(repairCharte(raw));
}

/** Nom propre : borné à 40 caractères, vide si invalide. */
export function cleanCharteName(raw: unknown): string {
  return (typeof raw === "string" ? raw.trim() : "").slice(0, 40);
}

export async function listUserChartes(admin: Admin, userId: string): Promise<SavedCharte[]> {
  const { data } = await admin
    .from("user_chartes")
    .select("id, name, spec")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(MAX_USER_CHARTES);
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    spec: r.spec as CharteSpec,
  }));
}

export async function countUserChartes(admin: Admin, userId: string): Promise<number> {
  const { count } = await admin
    .from("user_chartes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}
