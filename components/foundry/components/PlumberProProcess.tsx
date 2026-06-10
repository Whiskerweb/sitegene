// (Plumber Pro) Processus en 4 étapes sur fond accent : heading gauche + grille 2×2
// de cartes semi-transparentes, icône ronde blanche, titre blanc et texte blanc/70.
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";

interface StepItem { title: string; desc: string }

const STEP_ICONS = [
  <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  <><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></>,
  <path d="M14.7 6.3a4 4 0 00-5.4 5.4l-6 6a2 2 0 102.8 2.8l6-6a4 4 0 005.4-5.4l-2.5 2.5-2.1-.4-.4-2.1z"/>,
  <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></>,
];

export default function PlumberProProcess({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const items: StepItem[] = Array.isArray(content?.items) ? content.items : [
    { title: "Réservez un service", desc: "Planifiez votre intervention en ligne en quelques étapes simples." },
    { title: "Recevez un diagnostic", desc: "Nos plombiers arrivent à l'heure et proposent la meilleure solution." },
    { title: "On répare", desc: "Nous intervenons avec des outils de qualité pour une réparation durable." },
    { title: "L'esprit tranquille", desc: "Avec notre garantie, votre plomberie est entre de bonnes mains." },
  ];
  return (
    <section className="ppp relative py-20 md:py-28 px-6" style={{ background: "var(--c-accent)", ...root }}>
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
        {/* Gauche */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
            {content?.label ?? "Comment ça marche"}
          </span>
          <h2 className="mt-3 mb-5 text-3xl font-extrabold leading-tight text-white md:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
            {content?.title ?? "Des étapes simples pour démarrer dès maintenant"}
          </h2>
          <p className="mb-8 max-w-md text-base leading-relaxed text-white/75">
            {content?.subtitle ?? "Notre équipe qualifiée gère tout avec précision, rapidité et durabilité."}
          </p>
          <a href="#contact" className="inline-flex items-center gap-2 rounded-[var(--r-pill)] px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110" style={{ background: "color-mix(in srgb, var(--c-ink) 25%, transparent)" }}>
            {content?.cta ?? "Nous contacter"}
          </a>
        </div>

        {/* Droite : 2x2 */}
        <div className="grid gap-5 sm:grid-cols-2">
          {items.slice(0, 4).map((step, i) => (
            <div key={i} className="rounded-[var(--r-card)] border border-white/10 p-7" style={{ background: "color-mix(in srgb, var(--c-ink) 15%, transparent)" }}>
              <span className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "var(--c-accent)" }}>
                  {STEP_ICONS[i % STEP_ICONS.length]}
                </svg>
              </span>
              <h3 className="mb-2 text-xl font-bold text-white">{step.title}</h3>
              <p className="text-sm leading-relaxed text-white/70">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
