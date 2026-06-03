/**
 * Logique pure de planification de la séquence de prospection (sans I/O).
 * Extraite pour être testable indépendamment du worker.
 */

/** Espacement en jours : gap après l'initial (→ J+3), puis après la relance 1 (→ J+7). */
export const FOLLOWUP_GAP_DAYS = [3, 4];
export const DEFAULT_MAX_STEPS = 3;

export type AdvancedState = {
  step: number;
  status: "active" | "completed";
  next_run_at: string; // ISO
};

/**
 * État de la séquence APRÈS l'envoi de l'étape courante.
 * @param step      nb d'emails déjà envoyés AVANT cet envoi (0 = on envoie l'initial)
 * @param maxSteps  nb total d'emails de la séquence
 * @param nowMs     horodatage courant (ms)
 */
export function advanceAfterSend(opts: {
  step: number;
  maxSteps: number;
  nowMs: number;
  gaps?: number[];
}): AdvancedState {
  const gaps = opts.gaps ?? FOLLOWUP_GAP_DAYS;
  const newStep = opts.step + 1;
  if (newStep >= opts.maxSteps) {
    return { step: newStep, status: "completed", next_run_at: new Date(opts.nowMs).toISOString() };
  }
  const gapDays = gaps[newStep - 1] ?? gaps[gaps.length - 1] ?? 3;
  const next = opts.nowMs + gapDays * 24 * 60 * 60 * 1000;
  return { step: newStep, status: "active", next_run_at: new Date(next).toISOString() };
}

export type ProspectCodeStop = "opened" | "paid" | "expired";

/**
 * Statut `outreach` à appliquer si le prospect_code a évolué (stop séquence).
 * null = pas de stop, on continue la séquence.
 */
export function stopStatusForCode(codeStatus: string | null | undefined):
  | "engaged"
  | "converted"
  | "completed"
  | null {
  switch (codeStatus) {
    case "opened":
      return "engaged"; // a vu son reveal → on arrête les relances à froid
    case "paid":
      return "converted";
    case "expired":
      return "completed";
    default:
      return null;
  }
}
