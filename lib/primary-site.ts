/**
 * Site « principal » d'un client — modèle « 1 site / N peaux » (migration 0020).
 * Normalement un seul site par compte ; la sélection garde un fallback robuste :
 *   1. le site EN LIGNE (status=live) ;
 *   2. sinon le site débloqué (essai/payé) le plus récent ;
 *   3. sinon le plus récent.
 */
import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

const LOCKED_BILLING = new Set(["none", "canceled", "payment_failed"]);

type SiteRow = Record<string, unknown> & {
  status?: string | null;
  billing_status?: string | null;
};

/**
 * Choisit le site principal d'un client (déjà triés du plus récent au plus ancien).
 * Modèle « 1 site / N peaux » (migration 0020) : il n'y a normalement qu'UN site
 * par compte. Le fallback live > débloqué > récent reste pour robustesse.
 */
export function pickPrimarySite<T extends SiteRow>(rows: T[]): T | null {
  if (rows.length === 0) return null;
  const live = rows.find((r) => r.status === "live");
  if (live) return live;
  const unlocked = rows.find(
    (r) => !LOCKED_BILLING.has((r.billing_status as string) ?? "none"),
  );
  return unlocked ?? rows[0];
}

/**
 * Charge le site principal du client. `columns` = colonnes voulues par
 * l'appelant ; status/billing_status sont ajoutées d'office.
 */
export async function primarySiteForUser<T extends SiteRow = SiteRow>(
  admin: Admin,
  userId: string,
  columns: string,
): Promise<T | null> {
  const need = ["status", "billing_status"];
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
