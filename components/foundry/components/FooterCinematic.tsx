// components/foundry/components/FooterCinematic.tsx
// Import adapté (style « Cinematic / motion-footer ») : footer SOMBRE spectaculaire
// — bandeau marquee incliné, halo « aurora », grande accroche, liens en pilules
// de verre, texte géant de la marque en filigrane, barre basse (copyright +
// « créé avec ❤ » + retour en haut).
// ADAPTÉ aux conventions de la fonderie : PAS de GSAP, PAS de position:fixed ni
// d'effet « rideau » (incompatibles avec le canvas modulaire + le scroll de
// l'éditeur). Animations en CSS pur ; retour-haut = ancre #top. CSS vars only.
import type { CSSProperties, ReactNode } from "react";
import type { Skin } from "@/lib/foundry/types";
import { navLabel, navHref } from "@/lib/foundry/nav";

export default function FooterCinematic({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const words: string[] = Array.isArray(content?.words) && content.words.length ? content.words : ["Savoir-faire", "Confiance", "Qualité", "Proximité"];
  const links: unknown[] = Array.isArray(content?.links) ? content.links : [];
  const brand: string = content?.brand ?? "Marque";
  const heading: string = content?.heading ?? "Prêt à commencer ?";

  const seq: ReactNode = (
    <span className="flex shrink-0 items-center">
      {words.map((w, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6">{w}</span>
          <span style={{ color: i % 2 ? "var(--c-accent2)" : "var(--c-accent)" }}>✦</span>
        </span>
      ))}
    </span>
  );

  return (
    <footer className="relative overflow-hidden px-6 pt-10 pb-8" style={{ ...root, background: "var(--c-panel)", color: "var(--c-on-panel)" }}>
      <style>{`
        @keyframes sgcf-marquee { to { transform: translateX(-50%); } }
        @keyframes sgcf-breathe { 0% { transform: translate(-50%, -50%) scale(1); opacity: .5; } 100% { transform: translate(-50%, -50%) scale(1.12); opacity: .9; } }
        @keyframes sgcf-beat { 0%,100% { transform: scale(1); } 15%,45% { transform: scale(1.25); } 30% { transform: scale(1); } }
        .sgcf-marquee-track { animation: sgcf-marquee 40s linear infinite; }
        .sgcf-aurora { animation: sgcf-breathe 8s ease-in-out infinite alternate; }
        .sgcf-beat { animation: sgcf-beat 1.8s ease-in-out infinite; }
        .sgcf-pill { background: color-mix(in srgb, var(--c-on-panel) 7%, transparent); border: 1px solid color-mix(in srgb, var(--c-on-panel) 16%, transparent); backdrop-filter: blur(12px); transition: background .3s, border-color .3s, transform .3s; }
        .sgcf-pill:hover { background: color-mix(in srgb, var(--c-on-panel) 14%, transparent); border-color: color-mix(in srgb, var(--c-on-panel) 32%, transparent); transform: translateY(-2px); }
        @media (prefers-reduced-motion: reduce) { .sgcf-marquee-track, .sgcf-aurora, .sgcf-beat { animation: none; } }
      `}</style>

      {/* Halo aurora */}
      <div className="sgcf-aurora pointer-events-none absolute left-1/2 top-1/2 z-0 h-[55vh] w-[80%] rounded-[50%] blur-[80px]" style={{ background: "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--c-accent) 28%, transparent) 0%, color-mix(in srgb, var(--c-accent2) 20%, transparent) 45%, transparent 70%)" }} aria-hidden />

      {/* Texte géant de la marque en filigrane */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-0 select-none text-center font-black leading-[0.7] tracking-tighter" style={{ fontSize: "clamp(4rem, 22vw, 18rem)", color: "transparent", WebkitTextStroke: "1px color-mix(in srgb, var(--c-on-panel) 8%, transparent)", transform: "translateY(28%)" }}>
        {brand.toUpperCase()}
      </div>

      {/* Bandeau marquee incliné */}
      <div className="absolute left-0 top-6 z-10 w-full -rotate-2 overflow-hidden border-y py-3 backdrop-blur-md" style={{ borderColor: "color-mix(in srgb, var(--c-on-panel) 14%, transparent)", background: "color-mix(in srgb, var(--c-panel) 40%, transparent)" }}>
        <div className="sgcf-marquee-track flex w-max whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.25em] md:text-xs" style={{ color: "color-mix(in srgb, var(--c-on-panel) 55%, transparent)" }}>
          {seq}{seq}
        </div>
      </div>

      {/* Contenu central */}
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center pt-28 text-center">
        <h2 className="text-4xl font-black tracking-tight md:text-7xl" style={{ fontFamily: "var(--font-heading)", color: "var(--c-on-panel)" }}>{heading}</h2>
        {links.length > 0 && (
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {links.map((l, i) => (
              <a key={i} href={navHref(l)} className="sgcf-pill rounded-[var(--r-pill)] px-7 py-3.5 text-sm font-semibold" style={{ color: "var(--c-on-panel)" }}>{navLabel(l)}</a>
            ))}
          </div>
        )}
      </div>

      {/* Barre basse */}
      <div className="relative z-10 mt-16 flex flex-col items-center justify-between gap-4 md:flex-row" style={{ color: "color-mix(in srgb, var(--c-on-panel) 55%, transparent)" }}>
        <p className="order-2 text-[10px] font-semibold uppercase tracking-widest md:order-1">{content?.copyright ?? `© ${brand}. Tous droits réservés.`}</p>
        <div className="sgcf-pill order-1 flex items-center gap-2 rounded-[var(--r-pill)] px-5 py-2.5 md:order-2">
          <span className="text-[10px] font-bold uppercase tracking-widest">Créé avec</span>
          <span className="sgcf-beat text-sm" style={{ color: "var(--c-accent2)" }}>❤</span>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--c-on-panel)" }}>{brand}</span>
        </div>
        <a href="#top" aria-label="Retour en haut" className="sgcf-pill order-3 flex h-11 w-11 items-center justify-center rounded-full" style={{ color: "var(--c-on-panel)" }}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
        </a>
      </div>
    </footer>
  );
}
