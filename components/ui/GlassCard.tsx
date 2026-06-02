import type { ReactNode } from "react";

export function GlassCard({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`glass rounded-2xl ${className}`}>{children}</div>;
}
