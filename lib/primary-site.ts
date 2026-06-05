/**
 * Site « principal » d'un client.
 * Règle de sélection (par priorité) :
 *   1. le site is_active=true EN LIGNE (payé/essai) le plus récent ;
 *   2. le site is_active=true débloqué (essai/payé pas encore live) ;
 *   3. le site is_active=true brouillon le plus récent ;
 *   4. fallback : n'importe quel site (cas migration avant la colonne is_active).
 */
import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

const LOCKED_BILLING = new Set(["none", "canceled", "payment_failed"]);

type SiteRow = Record<string, unknown> & {
  status?: string | null;
  billing_status?: string | null;
  is_active?: boolean | null;
};

/** Choisit le site principal parmi les sites d'un client (déjà triés du plus récent au plus ancien). */
export function pickPrimarySite<T extends SiteRow>(rows: T[]): T | null {
  if (rows.length === 0) return null;
  // Priorité aux sites marqués actifs (post-migration 0019).
  const active = rows.filter((r) => r.is_active !== false);
  const pool = active.length > 0 ? active : rows; // fallback pré-migration
  const live = pool.find((r) => r.status === "live");
  if (live) return live;
  const unlocked = pool.find(
    (r) => !LOCKED_BILLING.has((r.billing_status as string) ?? "none"),
  );
  return unlocked ?? pool[0];
}

/**
 * Charge le site principal du client. `columns` = colonnes voulues par
 * l'appelant ; status/billing_status/is_active sont ajoutées d'office.
 */
export async function primarySiteForUser<T extends SiteRow = SiteRow>(
  admin: Admin,
  userId: string,
  columns: string,
): Promise<T | null> {
  const need = ["status", "billing_status", "is_active"];
  const cols = columns
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  for (const n of need) if (!cols.includes(n)) cols.push(n);

  const { data } = await admin
    .from("sites")
    .select(cols.join(", "))
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return pickPrimarySite((data ?? []) as unknown as T[]);
}
