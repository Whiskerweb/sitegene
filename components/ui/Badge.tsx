import type { ReactNode } from "react";
import type { Tone } from "@/lib/ui/status";

export const toneClasses: Record<Tone, string> = {
  neutral: "bg-sky-200 text-slate",
  brand: "bg-blue text-brand",
  success: "bg-success-50 text-success",
  warn: "bg-[#fdf0d5] text-warn",
  danger: "bg-[#fde8e8] text-danger",
};

export const toneDot: Record<Tone, string> = {
  neutral: "bg-slate",
  brand: "bg-brand",
  success: "bg-success",
  warn: "bg-warn",
  danger: "bg-danger",
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
