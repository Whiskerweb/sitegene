/**
 * Composants présentation partagés de l'admin (server-safe, pas d'état).
 * Source de vérité des libellés/couleurs : lib/crm/stages.ts & lib/crm/categories.ts.
 */
import type { PipelineStage, PipelineStatus } from "@/lib/types/db";
import { STAGE_BY_ID, STATUS_BY_ID, leadTemperature, stageLabel, statusLabel } from "@/lib/crm/stages";
import { categoryDef, categoryLabel } from "@/lib/crm/categories";

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—";

export const fmtDateTime = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

/** « il y a 3 j », « il y a 2 h », etc. */
export function relativeTime(d: string | null | undefined): string {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.round(h / 24);
  return `il y a ${j} j`;
}

export function Stat({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: string | number;
  accent?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-ink-800 p-5">
      <div className={`font-display text-[32px] font-semibold leading-none ${accent ?? "text-paper"}`}>
        {value}
      </div>
      <div className="mt-2 text-[13px] text-faint">{label}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-faint/70">{hint}</div> : null}
    </div>
  );
}

export function StageBadge({ stage }: { stage: PipelineStage }) {
  const s = STAGE_BY_ID[stage];
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] ${s?.cls ?? "text-faint border-line"}`}>
      {stageLabel(stage)}
    </span>
  );
}

export function StatusBadge({ status }: { status: PipelineStatus }) {
  const s = STATUS_BY_ID[status];
  if (status === "EN_COURS") return null; // statut neutre : on n'encombre pas
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] ${s?.cls ?? "text-faint border-line"}`}>
      {statusLabel(status)}
    </span>
  );
}

export function CategoryChip({ category }: { category: string | null }) {
  const def = categoryDef(category);
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[11px] ${
        def?.cls ?? "text-faint border-line"
      }`}
    >
      {categoryLabel(category)}
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const t = leadTemperature(score);
  return (
    <span className={`inline-flex items-center gap-1 text-[12px] font-medium ${t.cls}`}>
      {t.label}
      <span className="text-faint">· {score}</span>
    </span>
  );
}
