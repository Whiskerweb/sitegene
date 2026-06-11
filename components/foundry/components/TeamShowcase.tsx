"use client";
// components/foundry/components/TeamShowcase.tsx
// Import adapté (style « team-showcase ») : l'équipe en 3 COLONNES de photos
// décalées (noir & blanc → couleur au survol, les autres s'estompent) + une
// liste de noms à droite qui révèle les réseaux au survol. MODULABLE : marche
// avec 1 à N membres (répartition par modulo). CSS vars + SocialIcon ; pas de
// react-icons. Survol synchronisé photos ↔ liste.
import { useState } from "react";
import type { Skin } from "@/lib/foundry/types";
import { Eyebrow } from "../primitives";
import SocialIcon from "./SocialIcon";

interface Member {
  name: string;
  role: string;
  avatar: string;
  linkedin?: string;
  instagram?: string;
  x?: string;
}

const SIZES = [
  "w-[110px] h-[120px] sm:w-[130px] sm:h-[140px] md:w-[155px] md:h-[165px]",
  "w-[122px] h-[132px] sm:w-[145px] sm:h-[155px] md:w-[172px] md:h-[182px]",
  "w-[115px] h-[125px] sm:w-[136px] sm:h-[146px] md:w-[162px] md:h-[172px]",
];
const OFFSETS = ["", "mt-[48px] sm:mt-[56px] md:mt-[68px]", "mt-[22px] sm:mt-[26px] md:mt-[32px]"];

export default function TeamShowcase({ content }: { content: any; skin: Skin }) {
  const [hover, setHover] = useState<number | null>(null);
  const items: Member[] = Array.isArray(content?.items) ? content.items : [];
  const cols = [0, 1, 2].map((c) => items.map((m, i) => ({ m, i })).filter(({ i }) => i % 3 === c));

  return (
    <section className="px-5 py-16 md:py-24" style={{ background: "var(--c-surface)" }}>
      <div className="mx-auto max-w-5xl">
        {(content?.eyebrow || content?.title) && (
          <div className="mb-10">
            {content?.eyebrow && <Eyebrow>{content.eyebrow}</Eyebrow>}
            {content?.title && (
              <h2 className="mt-3 text-[2rem] md:text-[2.8rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.2px", lineHeight: 1.1 }}>{content.title}</h2>
            )}
          </div>
        )}

        <div className="flex select-none flex-col items-start gap-8 md:flex-row md:gap-12">
          {/* Grille de photos décalées (scroll horizontal si trop large) */}
          <div className="flex max-w-full flex-shrink-0 justify-center gap-2 overflow-x-auto pb-1 md:justify-start md:gap-3">
            {cols.map((col, c) => (
              <div key={c} className={`flex flex-col gap-2 md:gap-3 ${OFFSETS[c]}`}>
                {col.map(({ m, i }) => {
                  const active = hover === i;
                  const dimmed = hover !== null && !active;
                  // Par défaut (rien de survolé/tapé) TOUT est en couleur ;
                  // le gris ne touche que les AUTRES quand une est mise en avant.
                  const colored = active || hover === null;
                  return (
                    <button
                      type="button"
                      key={i}
                      className={`flex-shrink-0 overflow-hidden rounded-xl transition-opacity duration-300 ${SIZES[c]}`}
                      style={{ opacity: dimmed ? 0.6 : 1 }}
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => setHover((h) => (h === i ? null : i))}
                      aria-label={m.name}
                    >
                      <img src={m.avatar} alt={m.name} loading="lazy" className="h-full w-full object-cover transition-[filter] duration-500" style={{ filter: colored ? "grayscale(0) brightness(1)" : "grayscale(1) brightness(.78)" }} />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Liste de noms + réseaux */}
          <div className="flex w-full flex-1 flex-col gap-4 sm:grid sm:grid-cols-2 md:flex md:flex-col md:gap-5">
            {items.map((m, i) => {
              const active = hover === i;
              const dimmed = hover !== null && !active;
              const socials: Array<[string, string | undefined]> = [["x", m.x], ["linkedin", m.linkedin], ["instagram", m.instagram]];
              const has = socials.some(([, v]) => v);
              return (
                <div key={i} className="cursor-pointer transition-opacity duration-300" style={{ opacity: dimmed ? 0.5 : 1 }} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover((h) => (h === i ? null : i))}>
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 flex-shrink-0 rounded-[5px] transition-all duration-300" style={{ width: active ? 20 : 16, background: active ? "var(--c-ink)" : "color-mix(in srgb, var(--c-ink) 25%, transparent)" }} />
                    <span className="text-base font-semibold leading-none tracking-tight transition-colors duration-300 md:text-[18px]" style={{ color: active ? "var(--c-ink)" : "color-mix(in srgb, var(--c-ink) 80%, transparent)" }}>{m.name}</span>
                    {has && (
                      <div className="ml-0.5 flex items-center gap-1.5 transition-all duration-200" style={{ opacity: active ? 1 : 0, transform: active ? "translateX(0)" : "translateX(-8px)", pointerEvents: active ? "auto" : "none" }}>
                        {socials.map(([plat, href]) => href ? (
                          <a key={plat} href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="rounded p-1 transition-transform hover:scale-110" style={{ color: "var(--c-muted)" }} aria-label={plat}>
                            <SocialIcon platform={plat} className="h-3 w-3" />
                          </a>
                        ) : null)}
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 pl-[27px] text-[9px] font-medium uppercase tracking-[0.2em] md:text-[10px]" style={{ color: "var(--c-muted)" }}>{m.role}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
