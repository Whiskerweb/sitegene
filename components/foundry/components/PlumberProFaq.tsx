// (Plumber Pro) FAQ accordéon client — max-w-3xl centré, cartes blanches radius-card,
// icône "+" qui pivote en "×" à l'ouverture (state "use client").
"use client";
import { useState, type CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";

interface FaqItem { question: string; answer: string }

export default function PlumberProFaq({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const items: FaqItem[] = Array.isArray(content?.items) ? content.items : [
    { question: "Comment prendre rendez-vous ?", answer: "La réservation en ligne ne prend que quelques minutes. Choisissez votre service, sélectionnez une date et confirmez instantanément." },
    { question: "Intervenez-vous vraiment 24/7 en urgence ?", answer: "Oui — notre service d'urgence est disponible jour et nuit, week-ends compris, pour les fuites et ruptures de canalisation." },
    { question: "Vos plombiers sont-ils certifiés ?", answer: "Tous nos plombiers sont qualifiés, certifiés et assurés. Chacun suit une formation continue avant d'intervenir." },
    { question: "Que se passe-t-il si je ne suis pas satisfait ?", answer: "Votre satisfaction est notre priorité. Si le résultat ne vous convient pas, nous renvoyons une équipe sans frais supplémentaires." },
  ];
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="ppfaq bg-[var(--c-card)] py-20 md:py-28 px-6" style={root}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--c-accent)" }}>
            {content?.label ?? "FAQ"}
          </span>
          <h2 className="mt-3 mb-4 text-3xl font-extrabold leading-tight md:text-5xl" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)" }}>
            {content?.title ?? "Tout ce que vous devez savoir"}
          </h2>
          {content?.subtitle && (
            <p className="text-base" style={{ color: "var(--c-muted)" }}>{content.subtitle}</p>
          )}
        </div>

        <ul className="space-y-3">
          {items.map((item, i) => {
            const open = openIdx === i;
            return (
              <li key={i} className="overflow-hidden rounded-[var(--r-card)] bg-[var(--c-surface)] shadow-sm">
                <button
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left focus:outline-none"
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                >
                  <span className="text-sm font-bold" style={{ color: "var(--c-ink)" }}>{item.question}</span>
                  <span
                    className="flex-shrink-0 text-2xl font-light leading-none transition-transform duration-300"
                    style={{ color: "var(--c-accent)", transform: open ? "rotate(45deg)" : "none" }}
                    aria-hidden="true"
                  >+</span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: open ? "320px" : "0" }}
                >
                  <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: "var(--c-muted)" }}>{item.answer}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
