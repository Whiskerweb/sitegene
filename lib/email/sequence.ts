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

/**
 * Décision d'arrêt de la séquence (logique pure).
 * - `codeStatus` vient de prospect_codes : `paid` = client, `expired` = périmé.
 * - `engagedAfterSend` = un vrai événement d'ouverture/clic du reveal s'est
 *   produit APRÈS notre dernier envoi (lu dans la table `events`).
 *
 * On n'utilise volontairement PAS le statut `opened` du code : il peut provenir
 * d'une prévisualisation opérateur antérieure à la campagne (faux positif).
 * null = pas de stop, on continue la séquence.
 */
export function shouldStop(opts: {
  codeStatus?: string | null;
  engagedAfterSend: boolean;
}): "converted" | "completed" | "engaged" | null {
  if (opts.codeStatus === "paid") return "converted";
  if (opts.codeStatus === "expired") return "completed";
  if (opts.engagedAfterSend) return "engaged";
  return null;
}
