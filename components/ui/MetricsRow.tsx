import type { ReactNode } from "react";

type MetricTone = "sky" | "indigo" | "violet" | "emerald" | "amber" | "rose";

const topBorder: Record<MetricTone, string> = {
  sky: "border-t-sky-400",
  indigo: "border-t-indigo-500",
  violet: "border-t-violet-600",
  emerald: "border-t-emerald-500",
  amber: "border-t-amber-400",
  rose: "border-t-rose-500",
};

const dot: Record<MetricTone, string> = {
  sky: "bg-sky-400",
  indigo: "bg-indigo-500",
  violet: "bg-violet-600",
  emerald: "bg-emerald-500",
  amber: "bg-amber-400",
  rose: "bg-rose-500",
};

export type Metric = {
  label: string;
  value: ReactNode;
  tone?: MetricTone;
  hint?: string;
};

/**
 * Rangée de KPI façon Traaaction : une seule carte blanche découpée en colonnes
 * par `divide-x`, chaque colonne portant une bordure haute colorée + une pastille
 * + un gros chiffre en police display.
 */
export function MetricsRow({
  metrics,
  className = "",
}: {
  metrics: Metric[];
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-200 bg-white ${className}`}
    >
      <div
        className="grid divide-x divide-gray-200"
        style={{
          gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))`,
        }}
      >
        {metrics.map((m, i) => {
          const tone = m.tone ?? "violet";
          return (
            <div
              key={i}
              className={`min-w-0 border-t-4 p-3 sm:p-5 ${topBorder[tone]}`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 shrink-0 rounded ${dot[tone]}`} />
                <span className="truncate text-xs font-medium text-gray-500 sm:text-sm">
                  {m.label}
                </span>
              </div>
              <div
                className="mt-2 truncate text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {m.value}
              </div>
              {m.hint && (
                <div className="mt-1 truncate text-xs text-gray-400">{m.hint}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
