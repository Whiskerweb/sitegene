import type { ReactNode } from "react";

type BadgeTone = "violet" | "amber" | "blue" | "gray" | "emerald";

const badgeTone: Record<BadgeTone, string> = {
  violet: "bg-violet-500/20 text-violet-300",
  amber: "bg-amber-500/20 text-amber-300",
  blue: "bg-blue-500/20 text-blue-300",
  emerald: "bg-emerald-500/20 text-emerald-300",
  gray: "bg-white/10 text-gray-300",
};

/**
 * Bandeau hero sombre dégradé — réplique de la bannière « Affiliate revenue »
 * de Traaaction : fond gray-900, voile violet→cyan, label uppercase + badge,
 * gros chiffre/titre en police display, slot droit (barre de progression, CTA,
 * actions…).
 */
export function HeroBanner({
  label,
  value,
  badge,
  right,
  className = "",
}: {
  label: string;
  value: ReactNode;
  badge?: { text: string; tone?: BadgeTone };
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gray-900 p-5 sm:p-6 ${className}`}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/5"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
              {label}
            </span>
            {badge && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  badgeTone[badge.tone ?? "violet"]
                }`}
              >
                {badge.text}
              </span>
            )}
          </div>
          <div
            className="mt-1.5 text-3xl font-bold tracking-tight text-white tabular-nums sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {value}
          </div>
        </div>
        {right && <div className="w-full sm:w-auto">{right}</div>}
      </div>
    </div>
  );
}

/**
 * Barre de progression « This month / limit » du hero (rail sombre + remplissage
 * coloré selon un seuil). À placer dans le slot `right` du HeroBanner.
 */
export function HeroProgress({
  leftLabel,
  rightLabel,
  pct,
  tone = "violet",
}: {
  leftLabel: string;
  rightLabel: string;
  pct: number;
  tone?: "violet" | "amber" | "red";
}) {
  const fill =
    tone === "red"
      ? "bg-red-400"
      : tone === "amber"
        ? "bg-amber-400"
        : "bg-violet-400";
  return (
    <div className="w-full sm:w-44">
      <div className="mb-1.5 flex items-center justify-between text-[11px] text-gray-400">
        <span>{leftLabel}</span>
        <span className="tabular-nums">{rightLabel}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-700 ${fill}`}
          style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
        />
      </div>
    </div>
  );
}
