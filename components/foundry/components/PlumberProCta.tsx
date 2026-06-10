// (Plumber Pro) CTA plein fond accent : titre centré + sous-titre + 2 boutons
// (prise de RDV + téléphone). Cercles décoratifs en arrière-plan.
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";

export default function PlumberProCta({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  return (
    <section className="ppcta relative overflow-hidden px-6 py-20 md:py-24" style={{ background: "var(--c-accent)", ...root }}>
      {/* Décorations cercles */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-black/5" aria-hidden />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <h2 className="mb-4 text-3xl font-extrabold leading-tight text-white md:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
          {content?.title ?? "Besoin d'un plombier ? Démarrons dès aujourd'hui"}
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-lg text-white/80">
          {content?.subtitle ?? "Notre équipe intervient vite, proprement et avec le sourire."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a href="#contact" className="rounded-[var(--r-pill)] px-8 py-4 text-sm font-semibold text-white transition-all hover:brightness-110" style={{ background: "color-mix(in srgb, var(--c-ink) 30%, transparent)" }}>
            {content?.button ?? "Prendre rendez-vous"}
          </a>
          {content?.phone && (
            <a href={`tel:${content.phone}`} className="inline-flex items-center gap-3 rounded-[var(--r-pill)] bg-white px-8 py-4 text-sm font-semibold transition-all hover:bg-white/90" style={{ color: "var(--c-ink)" }}>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true" style={{ color: "var(--c-accent)" }}><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
              <span>{content.phone}</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
