"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import type { PipelineStatus } from "@/lib/types/db";

/** Colonnes prospect éditables par l'opérateur (jamais l'état dérivé). */
const EDITABLE_FIELDS = new Set([
  "first_name",
  "email",
  "category",
  "city",
  "phone",
  "company_name",
  "website",
  "instagram",
  "source",
  "campaign_id",
]);

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Pose un statut MANUEL (Perdu / Non qualifié / Réouverture). Passe par la RPC
 * crm_set_manual_status (SECURITY DEFINER) qui trace l'historique et empêche le
 * recalcul d'écraser une décision humaine. Cf. migration 0012.
 */
export async function setProspectStatus(
  prospectId: string,
  status: Extract<PipelineStatus, "PERDU" | "NON_QUALIFIE" | "EN_COURS">,
  lostReason?: string | null,
): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile?.is_operator) return { ok: false, error: "Réservé à l'opérateur." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("crm_set_manual_status", {
    p_id: prospectId,
    p_status: status,
    p_lost_reason: lostReason ?? null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/prospects");
  revalidatePath(`/admin/prospects/${prospectId}`);
  return { ok: true };
}

/** Met à jour des champs enrichis du prospect (coordonnées, catégorie, source…). */
export async function updateProspectFields(
  prospectId: string,
  fields: Record<string, string | null>,
): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile?.is_operator) return { ok: false, error: "Réservé à l'opérateur." };

  const patch: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (EDITABLE_FIELDS.has(k)) patch[k] = v === "" ? null : v;
  }
  if (Object.keys(patch).length === 0) return { ok: false, error: "Aucun champ modifiable." };

  const supabase = await createClient();
  const { error } = await supabase.from("prospects").update(patch).eq("id", prospectId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/prospects");
  revalidatePath(`/admin/prospects/${prospectId}`);
  return { ok: true };
}
