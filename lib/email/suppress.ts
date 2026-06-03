import type { SupabaseClient } from "@supabase/supabase-js";

/** Events qui interdisent définitivement de réécrire à une adresse. */
const SUPPRESSED = ["unsubscribed", "complained", "bounced"];

/**
 * Une adresse est-elle suppressée (désinscrite / plainte / bounce dur) ?
 * Lit le journal `email_events`. Sûr par défaut : en cas d'erreur DB → false
 * (on ne bloque pas un envoi transactionnel légitime sur une panne de lecture),
 * l'appelant prospection re-checkant aussi le statut `outreach`.
 */
export async function isSuppressed(
  admin: SupabaseClient,
  email: string,
): Promise<boolean> {
  const { data } = await admin
    .from("email_events")
    .select("id")
    .eq("to_email", email.toLowerCase())
    .in("event", SUPPRESSED)
    .limit(1);
  return Boolean(data && data.length > 0);
}
