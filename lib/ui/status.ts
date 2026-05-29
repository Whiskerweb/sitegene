/** Source unique des libellés + tons de statut (FR). Utilisée par StatusPill. */
export type Tone = "neutral" | "brand" | "success" | "warn" | "danger";

export type StatusMeta = { label: string; tone: Tone };

export const noteStatusMeta: Record<string, StatusMeta> = {
  open: { label: "En attente", tone: "warn" },
  in_progress: { label: "Claude travaille…", tone: "brand" },
  done: { label: "Appliqué", tone: "success" },
  rejected: { label: "Refusé", tone: "neutral" },
};

export const siteStatusMeta: Record<string, StatusMeta> = {
  draft: { label: "Brouillon", tone: "neutral" },
  revealed: { label: "Aperçu prêt", tone: "brand" },
  live: { label: "En ligne", tone: "success" },
  suspended: { label: "Suspendu", tone: "danger" },
};

export const jobStatusMeta: Record<string, StatusMeta> = {
  pending: { label: "En file", tone: "neutral" },
  running: { label: "Claude travaille…", tone: "brand" },
  done: { label: "Terminé", tone: "success" },
  error: { label: "Échec", tone: "danger" },
};

/** Raisons du ledger de crédits → libellé FR. */
export const creditReasonLabel: Record<string, string> = {
  signup_grant: "Crédits offerts",
  note_spend: "Modification",
  subscription_refill: "Recharge abonnement",
  topup_purchase: "Achat de crédits",
  refund: "Remboursement",
  adjustment: "Ajustement",
};
