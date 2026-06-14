// (Plumber Pro) Stats 4 chiffres en ligne : eyebrow + titre centré + 4 colonnes
// accent/ink sur fond surface, séparateur top. Contenu statique (pas d'animation
// compteur pour rester Server Component).
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";

interface StatItem { value: string; label: string }

export default function PlumberProStats({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const items: StatItem[] = Array.isArray(content?.items) ? content.items : [
    { value: "8K+",  label: "Avis clients" },
    { value: "12+",  label: "Années d'expérience" },
    { value: "98%",  label: "Clients satisfaits" },
    { value: "24/7", label: "Disponibilité urgence" },
  ];
  return (
    <section className="ppstats py-20 md:py-24 px-6" style={{ background: "var(--c-surface)", ...root }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--c-accent)" }}>
            {content?.label ?? "Nos chiffres"}
          </span>
          <h2 className="mt-3 mb-4 text-3xl font-extrabold leading-tight md:text-5xl" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)" }}>
            {content?.title ?? "Des résultats qui font la différence"}
          </h2>
          {content?.subtitle && (
            <p className="mx-auto max-w-xl text-base" style={{ color: "var(--c-muted)" }}>{content.subtitle}</p>
          )}
        </div>

        <div
          className="grid grid-cols-2 gap-8 border-t pt-12 text-center md:grid-cols-4"
          style={{ borderColor: "color-mix(in srgb, var(--c-ink) 8%, transparent)" }}
        >
          {items.map((s, i) => (
            <div key={i}>
              <div className="mb-2 text-4xl font-extrabold md:text-5xl" style={{ color: "var(--c-accent)", fontFamily: "var(--font-heading)" }}>{s.value}</div>
              <div className="text-sm" style={{ color: "var(--c-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
