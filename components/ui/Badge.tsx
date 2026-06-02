import type { ReactNode } from "react";
import type { Tone } from "@/lib/ui/status";

export const toneClasses: Record<Tone, string> = {
  neutral: "bg-[rgb(var(--m-overlay)/0.08)] text-[rgb(var(--m-muted))]",
  brand: "bg-violet-500/15 text-violet-400",
  success: "bg-mint-400/12 text-mint-400",
  warn: "bg-gold-400/14 text-gold-400",
  danger: "bg-red-500/14 text-red-400",
};

export const toneDot: Record<Tone, string> = {
  neutral: "bg-[rgb(var(--m-faint))]",
  brand: "bg-violet-400",
  success: "bg-mint-400",
  warn: "bg-gold-400",
  danger: "bg-red-400",
};

export function Badge({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
