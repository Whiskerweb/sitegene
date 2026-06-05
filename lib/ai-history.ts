import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiMessageRow } from "./chat-thread";

/** Journalise un message du fil IA. Best-effort : ne casse jamais la requête appelante. */
export async function logAiMessage(
  admin: SupabaseClient,
  siteId: string,
  userId: string,
  role: AiMessageRow["role"],
  kind: AiMessageRow["kind"],
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await admin
      .from("ai_messages")
      .insert({ site_id: siteId, user_id: userId, role, kind, payload });
  } catch {
    // best-effort : l'échec de journalisation ne doit pas faire échouer l'édition
  }
}

/** Les `limit` derniers messages du site, renvoyés du plus ancien au plus récent. */
export async function listAiMessages(
  admin: SupabaseClient,
  siteId: string,
  limit = 50,
): Promise<AiMessageRow[]> {
  const { data, error } = await admin
    .from("ai_messages")
    .select("id, role, kind, payload, created_at")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(limit);
  // Dégradation gracieuse : l'historique est un confort, pas une donnée critique.
  // En cas d'erreur de lecture, on logue et on renvoie un fil vide plutôt que
  // de faire crasher l'éditeur.
  if (error) {
    console.error("[ai-history] listAiMessages:", error.message);
  }
  return ((data ?? []) as AiMessageRow[]).toReversed();
}
