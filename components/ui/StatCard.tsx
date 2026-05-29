import type { ReactNode } from "react";
import { Card } from "./Card";

type Tone = "plain" | "lav" | "pink" | "mint" | "blue";

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
    <Card tone={tone} className="p-5">
      <div className="flex items-start justify-between">
        <div className="font-archivo text-[28px] font-bold leading-none text-night">
          {value}
        </div>
        {icon && <span className="text-brand/70">{icon}</span>}
      </div>
      <div className="mt-2 text-[13px] font-medium text-slate">{label}</div>
      {hint && <div className="mt-0.5 text-xs text-mist">{hint}</div>}
    </Card>
  );
}
