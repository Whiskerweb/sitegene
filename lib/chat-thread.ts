/** Fil de conversation IA de l'éditeur — logique PURE (testée), aucune dépendance. */

export type AiMessageRow = {
  id: string;
  role: "user" | "assistant";
  kind: "text" | "proposal" | "commit";
  payload: Record<string, unknown>;
  created_at: string;
};

export type ProposalStatus = "active" | "expired" | "accepted";

export type ChatMessage =
  | { id: string; role: "user"; text: string; targetLabel?: string; effectName?: string }
  | { id: string; role: "assistant"; kind: "text"; text: string; isError?: boolean }
  | {
      id: string;
      role: "assistant";
      kind: "proposal";
      action: "css" | "component";
      explanation: string;
      status: ProposalStatus;
    };

const str = (v: unknown): string => (typeof v === "string" ? v : "");

/**
 * Historique DB → fil affichable. Un commit règle la proposition précédente la
 * plus récente non réglée (→ accepted) et n'apparaît pas lui-même dans le fil.
 * Toute proposition restée sans commit est « expired » : après rechargement,
 * l'aperçu live (CSS injecté / composant éphémère) n'existe plus.
 */
export function rowsToThread(rows: AiMessageRow[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  const open: number[] = []; // index (dans out) des propositions non réglées
  for (const r of rows) {
    if (r.role === "user") {
      const targetLabel = str(r.payload.targetLabel);
      const effectName = str(r.payload.effectName);
      out.push({
        id: r.id,
        role: "user",
        text: str(r.payload.message),
        ...(targetLabel ? { targetLabel } : {}),
        ...(effectName ? { effectName } : {}),
      });
    } else if (r.kind === "proposal") {
      open.push(out.length);
      out.push({
        id: r.id,
        role: "assistant",
        kind: "proposal",
        action: r.payload.action === "component" ? "component" : "css",
        explanation: str(r.payload.explanation),
        status: "expired",
      });
    } else if (r.kind === "commit") {
      const idx = open.pop();
      if (idx !== undefined) {
        const p = out[idx];
        if (p.role === "assistant" && p.kind === "proposal") p.status = "accepted";
      }
    } else {
      const error = str(r.payload.error);
      out.push({
        id: r.id,
        role: "assistant",
        kind: "text",
        text: error || str(r.payload.text),
        ...(error ? { isError: true } : {}),
      });
    }
  }
  return out;
}

/** Ajoute un message ; si c'est une proposition, l'ancienne proposition active expire. */
export function appendMessage(thread: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  const base =
    msg.role === "assistant" && msg.kind === "proposal"
      ? thread.map((m) =>
          m.role === "assistant" && m.kind === "proposal" && m.status === "active"
            ? { ...m, status: "expired" as const }
            : m,
        )
      : thread;
  return [...base, msg];
}

/** Règle (accepte / expire) la proposition identifiée. */
export function settleProposal(
  thread: ChatMessage[],
  id: string,
  status: "accepted" | "expired",
): ChatMessage[] {
  return thread.map((m) =>
    m.role === "assistant" && m.kind === "proposal" && m.id === id ? { ...m, status } : m,
  );
}
