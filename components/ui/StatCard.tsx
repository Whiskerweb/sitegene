import type { ReactNode } from "react";

type Tone = "plain" | "lav" | "pink" | "mint" | "blue";

// L'accent colore une fine barre + l'icône, sur une surface sombre commune.
const accent: Record<Tone, string> = {
  plain: "bg-[rgb(var(--m-faint))]",
  blue: "bg-violet-400",
  lav: "bg-[#b08bff]",
  pink: "bg-gold-400",
  mint: "bg-mint-400",
};
const accentText: Record<Tone, string> = {
  plain: "text-[rgb(var(--m-faint))]",
  blue: "text-violet-400",
  lav: "text-[#b08bff]",
  pink: "text-gold-400",
  mint: "text-mint-400",
};

export function StatCard({
  label,
  value,
  tone = "plain",
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] p-5">
      <span className={`absolute left-0 top-0 h-full w-[3px] ${accent[tone]}`} />
      <div className="flex items-start justify-between">
        <div className="text-[28px] font-bold leading-none text-[rgb(var(--m-ink))]">{value}</div>
        {icon && <span className={accentText[tone]}>{icon}</span>}
      </div>
      <div className="mt-2 text-[13px] font-medium text-[rgb(var(--m-muted))]">{label}</div>
      {hint && <div className="mt-0.5 text-xs text-[rgb(var(--m-faint))]">{hint}</div>}
    </div>
  );
}
