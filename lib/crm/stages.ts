/**
 * lib/crm/stages.ts — Source de vérité PARTAGÉE (UI ⇄ DB) du pipeline CRM.
 *
 * Les valeurs (ids, rangs) reflètent EXACTEMENT la migration 0011/0012
 * (CHECK pipeline_stage / pipeline_status + crm_stage_rank()). Si tu changes
 * un rang ou un id ici, change-le aussi côté SQL.
 *
 * Couleurs alignées sur le thème admin (ink/violet/gold/mint) — mêmes classes
 * que la map STATUS historique de app/admin/crm/page.tsx.
 */
import type { PipelineStage, PipelineStatus } from "@/lib/types/db";

export type StageDef = {
  id: PipelineStage;
  rank: number;
  label: string;
  /** Classes texte+bordure pour badges/colonnes. */
  cls: string;
  /** Couleur du point/accent. */
  dot: "faint" | "violet" | "gold" | "goldBright" | "mint";
};

/** Les 6 stages ACTIFS du Kanban, ordonnés (= colonnes, gauche → droite). */
export const PIPELINE_STAGES: StageDef[] = [
  { id: "A_CONTACTER",    rank: 0, label: "À contacter",   cls: "text-faint border-line",                dot: "faint" },
  { id: "CONTACTE",       rank: 1, label: "Contacté",      cls: "text-violet-400 border-violet-400/30",  dot: "violet" },
  { id: "REVEAL_VU",      rank: 2, label: "A vu son site", cls: "text-gold-400 border-gold-400/30",      dot: "gold" },
  { id: "ENGAGE",         rank: 3, label: "Engagé",        cls: "text-gold-400 border-gold-400/30",      dot: "gold" },
  { id: "GO_LIVE_INTENT", rank: 4, label: "Veut le mettre en ligne", cls: "text-[#ffcf5c] border-[#ffcf5c]/40", dot: "goldBright" },
  { id: "CLIENT",         rank: 5, label: "Client",        cls: "text-mint-400 border-mint-400/30",      dot: "mint" },
];

export const STAGE_BY_ID: Record<PipelineStage, StageDef> = Object.fromEntries(
  PIPELINE_STAGES.map((s) => [s.id, s]),
) as Record<PipelineStage, StageDef>;

export function stageRank(stage: PipelineStage | null | undefined): number {
  return stage ? (STAGE_BY_ID[stage]?.rank ?? 0) : 0;
}

export function stageLabel(stage: PipelineStage | null | undefined): string {
  return stage ? (STAGE_BY_ID[stage]?.label ?? stage) : "—";
}

export type StatusDef = {
  id: PipelineStatus;
  label: string;
  cls: string;
  /** true = sort du Kanban actif (masqué par défaut). */
  terminal: boolean;
};

export const PIPELINE_STATUSES: StatusDef[] = [
  { id: "EN_COURS",     label: "En cours",     cls: "text-muted border-line",                terminal: false },
  { id: "GAGNE",        label: "Gagné ✓",      cls: "text-mint-400 border-mint-400/30",      terminal: false },
  { id: "PERDU",        label: "Perdu",        cls: "text-faint border-line",                terminal: true },
  { id: "NON_QUALIFIE", label: "Non qualifié", cls: "text-faint border-line",                terminal: true },
  { id: "DESABONNE",    label: "Désinscrit",   cls: "text-[#ef6d6d] border-[#ef6d6d]/30",    terminal: true },
  { id: "BOUNCE",       label: "Bounce",       cls: "text-[#ef6d6d] border-[#ef6d6d]/30",    terminal: true },
];

export const STATUS_BY_ID: Record<PipelineStatus, StatusDef> = Object.fromEntries(
  PIPELINE_STATUSES.map((s) => [s.id, s]),
) as Record<PipelineStatus, StatusDef>;

export function statusLabel(status: PipelineStatus | null | undefined): string {
  return status ? (STATUS_BY_ID[status]?.label ?? status) : "—";
}

export function isTerminalStatus(status: PipelineStatus | null | undefined): boolean {
  return status ? (STATUS_BY_ID[status]?.terminal ?? false) : false;
}

/** Statuts qu'un opérateur peut poser manuellement (cf. crm_set_manual_status). */
export const MANUAL_STATUSES: PipelineStatus[] = ["PERDU", "NON_QUALIFIE", "EN_COURS"];

/** Motifs de perte structurés (alimentent la réactivation). */
export const LOST_REASONS: { id: string; label: string }[] = [
  { id: "no_response",    label: "Pas de réponse" },
  { id: "a_deja_un_site", label: "A déjà un site" },
  { id: "pas_de_budget",  label: "Pas de budget" },
  { id: "pas_interesse",  label: "Pas intéressé" },
  { id: "mauvais_contact", label: "Mauvais contact" },
  { id: "pas_le_bon_moment", label: "Pas le bon moment" },
];

/** Poids de score (réf. — la vérité de calcul est en SQL, crm_recompute_prospect). */
export const SCORE_WEIGHTS = {
  reveal_opened: 15,
  button_click: 10,
  email_clicked: 10,
  go_live_clicked: 40,
} as const;

/** Température lisible d'un prospect d'après son score. */
export function leadTemperature(score: number): { label: string; cls: string } {
  if (score >= 40) return { label: "🔥 Chaud", cls: "text-[#ffcf5c]" };
  if (score >= 15) return { label: "Tiède", cls: "text-gold-400" };
  if (score > 0) return { label: "Frais", cls: "text-violet-400" };
  return { label: "Froid", cls: "text-faint" };
}
