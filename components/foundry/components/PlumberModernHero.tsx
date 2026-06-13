// components/foundry/components/PlumberModernHero.tsx
// Extraction (Plumber Modern / BlueDrop — sites/artisans/plumber-modern/index.html) :
// hero en aplat accent pleine hauteur — badge étoile accent2, titre 3 lignes,
// CTA pilule accent2, rangée d'avatars + preuve sociale ; photo XL arrondie à droite.
// Prévu pour être surplombé par PlumberModernNavbar (nav absolue).
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";

const AVATARS_FALLBACK = [
  "/_templates/plumber-modern/img/team-1.jpg",
  "/_templates/plumber-modern/img/team-2.jpg",
  "/_templates/plumber-modern/img/team-3.jpg",
];

export default function PlumberModernHero({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = { background: "var(--c-surface)", minHeight: 640 };
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const avatars: string[] = Array.isArray(content?.avatars) && content.avatars.length ? content.avatars : AVATARS_FALLBACK;
  return (
    <section className="relative flex items-center overflow-hidden" style={root}>
      <style>{`
        .pmhero-in { opacity: 0; animation: pmhero-rise .9s cubic-bezier(.22,.61,.36,1) forwards; }
        .pmhero-in2 { opacity: 0; animation: pmhero-rise .9s cubic-bezier(.22,.61,.36,1) .15s forwards; }
        @keyframes pmhero-rise { from { opacity: 0; transform: translateY(40px) } to { opacity: 1; transform: none } }
        @media (prefers-reduced-motion: reduce) { .pmhero-in, .pmhero-in2 { animation: none; opacity: 1 } }
      `}</style>
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-6 pb-16 pt-32 md:grid-cols-2">
        {/* Gauche : copie */}
        <div className="pmhero-in">
          <div className="mb-7 inline-flex items-center gap-2 rounded-[var(--r-pill)] px-3.5 py-1.5 text-xs font-semibold" style={{ background: "var(--c-accent)", color: "var(--c-on-accent)" }}>
            <span>★</span>
            <span>{content?.badge ?? "Noté 4,9 par nos clients satisfaits"}</span>
          </div>
          <h1 className="mb-6 text-5xl font-semibold leading-[1.04] md:text-6xl lg:text-7xl" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)" }}>
            <span>{content?.titleA ?? "Tous vos besoins"}</span><br />
            <span>{content?.titleB ?? "en plomberie"}</span><br />
            <span>{content?.titleC ?? "pour votre maison"}</span>
          </h1>
          <p className="mb-9 max-w-md text-base leading-relaxed md:text-lg" style={{ color: "var(--c-muted)" }}>
            {content?.tagline ?? "Nous couvrons tous vos besoins de plomberie pour garder votre maison sûre, confortable et sereine."}
          </p>
          <a href={content?.ctaHref || "#contact"} className="inline-flex items-center gap-2 rounded-[var(--r-pill)] px-7 py-4 text-sm font-semibold shadow-lg shadow-black/10 transition-all hover:brightness-105" style={{ background: "var(--c-accent)", color: "var(--c-on-accent)" }}>
            {content?.cta ?? "Réserver une consultation gratuite"}
          </a>
          <div className="mt-9 flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {avatars.map((a, i) => (
                <img key={i} src={a} alt="" className="h-9 w-9 rounded-full border-2 object-cover" style={{ borderColor: "var(--c-surface)" }} />
              ))}
            </div>
            <span className="max-w-[160px] text-xs leading-snug" style={{ color: "var(--c-muted)" }}>{content?.proof ?? "Plus de 10 000 particuliers nous font confiance"}</span>
          </div>
        </div>
        {/* Droite : photo */}
        <div className="pmhero-in2 relative">
          <div className="overflow-hidden rounded-[var(--r-xl)] shadow-2xl shadow-black/20">
            <img src={content?.image ?? "/_templates/plumber-modern/img/hero.jpg"} alt="" className="h-[440px] w-full object-cover md:h-[520px]" />
          </div>
        </div>
      </div>
    </section>
  );
}
