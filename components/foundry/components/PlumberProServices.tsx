// (Plumber Pro) Services en liste : heading + CTA à gauche, 4 rangées de cartes
// fond blanc avec icône + titre + description + flèche hover. Fond de section card.
import type { CSSProperties, ReactNode } from "react";
import type { Skin } from "@/lib/foundry/types";

interface ServiceItem { title: string; desc: string }

// SVG icons par clé (simple set)
const ICONS: Record<string, ReactNode> = {
  drop: <path d="M12 2c3 4.5 6 8 6 11a6 6 0 11-12 0c0-3 3-6.5 6-11z" />,
  wrench: <path d="M14.7 6.3a4 4 0 00-5.4 5.4l-6 6a2 2 0 102.8 2.8l6-6a4 4 0 005.4-5.4l-2.5 2.5-2.1-.4-.4-2.1z" />,
  pipe: <><path d="M4 7h10v4H4z" /><path d="M14 9h3a3 3 0 013 3v8M9 11v4a2 2 0 002 2h3" /></>,
  heater: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6" /></>,
};

function Icon({ name }: { name?: string }) {
  const el = ICONS[name ?? "drop"] ?? ICONS["drop"];
  return (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">{el}</svg>
  );
}

export default function PlumberProServices({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const items: (ServiceItem & { icon?: string })[] = Array.isArray(content?.items) ? content.items : [
    { title: "Dépannage d'urgence", desc: "Intervention rapide 24/7 pour les fuites et ruptures.", icon: "drop" },
    { title: "Débouchage canalisations", desc: "Service rapide pour bouchons et obstructions.", icon: "wrench" },
    { title: "Installation & remplacement", desc: "Solutions d'installation livrées dans les délais.", icon: "pipe" },
    { title: "Chauffe-eau & ballon", desc: "Réparations rapides pour vos problèmes de chauffe-eau.", icon: "heater" },
  ];
  return (
    <section className="ppsrv bg-[var(--c-card)] py-20 md:py-28 px-6" style={root}>
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
        {/* Gauche */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--c-accent)" }}>
            {content?.label ?? "Nos services"}
          </span>
          <h2 className="mt-3 mb-5 text-3xl font-extrabold leading-tight md:text-5xl" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)" }}>
            {content?.title ?? "Des solutions de plomberie fiables"}
          </h2>
          <p className="mb-8 max-w-md text-base leading-relaxed" style={{ color: "var(--c-muted)" }}>
            {content?.subtitle ?? "Notre équipe qualifiée gère tout, des fuites aux installations, avec précision et durabilité."}
          </p>
          <a href="#contact" className="inline-flex items-center gap-2 rounded-[var(--r-pill)] px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110" style={{ background: "var(--c-accent)" }}>
            {content?.cta ?? "Voir tous les services"}
          </a>
        </div>

        {/* Droite : liste de cartes */}
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="ppsrv-card group flex items-start gap-5 rounded-[var(--r-card)] bg-[var(--c-surface)] p-7 shadow-sm transition-shadow hover:shadow-md">
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full" style={{ background: "var(--c-card)", color: "var(--c-accent)" }}>
                <Icon name={item.icon} />
              </span>
              <div className="flex-1">
                <h3 className="mb-1.5 text-lg font-bold" style={{ color: "var(--c-ink)" }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--c-muted)" }}>{item.desc}</p>
              </div>
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition-colors group-hover:text-white" style={{ borderColor: "color-mix(in srgb, var(--c-ink) 12%, transparent)", color: "var(--c-ink)" }}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
