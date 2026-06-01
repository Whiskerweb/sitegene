import type { SupabaseClient } from "@supabase/supabase-js";

/** Solde courant (dernier balance_after du ledger, sinon 0). SERVEUR/admin. */
export async function getBalance(
  admin: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data } = await admin
    .from("credit_ledger")
    .select("balance_after")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.balance_after ?? 0;
}

type Reason =
  | "signup_grant"
  | "note_spend"
  | "subscription_refill"
  | "topup_purchase"
  | "refund"
  | "adjustment"
  | "edit_publish"
  | "ai_edit";

/** Écrit une ligne de ledger (append-only) avec le nouveau solde. SERVEUR/admin. */
export async function grantCredits(
  admin: SupabaseClient,
  userId: string,
  delta: number,
  reason: Reason,
  refs: { note_id?: string; payment_id?: string } = {},
): Promise<number> {
  const current = await getBalance(admin, userId);
  const balance_after = current + delta;
  await admin.from("credit_ledger").insert({
    user_id: userId,
    delta,
    reason,
    balance_after,
    note_id: refs.note_id ?? null,
    payment_id: refs.payment_id ?? null,
  });
  return balance_after;
}
