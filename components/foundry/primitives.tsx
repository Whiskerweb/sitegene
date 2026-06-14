// components/foundry/primitives.tsx
import type { ReactNode } from "react";

/** Section : fond pilotable par la vibe (surface | card), padding généreux. */
export function Section({ id, surface = "surface", children, className = "" }: { id?: string; surface?: "surface" | "card"; children: ReactNode; className?: string }) {
  const bg = surface === "card" ? "var(--c-card)" : "var(--c-surface)";
  return (
    <section id={id} className={`px-5 py-16 md:py-24 ${className}`} style={{ background: bg }}>
      <div className="mx-auto max-w-[1280px]">{children}</div>
    </section>
  );
}

/** Éyebrow : petite étiquette, point accent + libellé. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--c-accent)" }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--c-accent2)" }} />
      {children}
    </p>
  );
}

/** Pill : pastille pleine accent (CTA) ou contour. */
export function Pill({ href = "#", children, variant = "solid" }: { href?: string; children: ReactNode; variant?: "solid" | "ghost" }) {
  const style = variant === "solid"
    ? { background: "var(--c-accent)", color: "#fff" }
    : { border: "1px solid color-mix(in srgb, var(--c-accent) 30%, transparent)", color: "var(--c-ink)" };
  return (
    <a href={href} className="inline-flex items-center rounded-[var(--r-pill)] px-6 py-3 text-sm font-bold transition hover:brightness-95" style={style}>
      {children}
    </a>
  );
}
