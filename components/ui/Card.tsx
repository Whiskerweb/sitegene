import type { ReactNode } from "react";

type Tone = "plain" | "lav" | "pink" | "mint" | "blue";

const toneBg: Record<Tone, string> = {
  plain: "bg-surface",
  lav: "bg-lav",
  pink: "bg-pink",
  mint: "bg-mint",
  blue: "bg-blue",
};

export function Card({
  tone = "plain",
  className = "",
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-[20px] border border-sky-300 ${toneBg[tone]} shadow-cloud-sm ${className}`}
    >
      {children}
    </div>
  );
}
