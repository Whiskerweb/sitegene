// (Studio Portfolio) Grille décalée de 5 projets (2 cols, offsets verticaux) avec parallaxe au scroll via GSAP.
"use client";
import { useEffect, useRef } from "react";
import type { Skin } from "@/lib/foundry/types";

interface WorkItem { title?: string; index?: string; image?: string }

export default function StudioPortfolioWorks({ content, skin }: { content: any; skin: Skin }) {
  const intro: string = typeof content.intro === "string" ? content.intro : "";
  const cta: string = typeof content.cta === "string" ? content.cta : "Voir les travaux";
  const items: WorkItem[] = Array.isArray(content.items) ? content.items : [];
  const templateBase: string = typeof content._templateBase === "string" ? content._templateBase : "";
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof window === "undefined") return;
    const gsap = (window as any).gsap;
    const ST = (window as any).ScrollTrigger;
    if (!gsap || !ST) return;
    gsap.registerPlugin(ST);
    el.querySelectorAll<HTMLElement>("[data-spw-parallax]").forEach((card) => {
      gsap.to(card, {
        yPercent: -12, ease: "none",
        scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
  }, []);

  const offsets = ["mt-0 md:mt-40", "mt-12 md:mt-12", "mt-12 md:mt-48 md:col-start-1", "mt-12 md:mt-12", "mt-12 md:mt-40 md:col-start-2"];
  const aspects = ["aspect-[4/3]", "aspect-[4/3]", "aspect-[3/4] max-w-[420px] mx-auto", "aspect-[4/3]", "aspect-[4/3]"];

  return (
    <section ref={sectionRef} className="spworks" style={{ "--c-accent": skin.accent } as React.CSSProperties}>
      <style>{`
        .spworks {
          padding: 96px 40px 0;
          background: var(--c-ink, #000);
        }
        .spworks-intro {
          max-width: 420px; font-size: 14px; line-height: 1.6;
          color: rgba(187,187,187,0.7); margin-top: 80px;
          font-family: var(--font-body);
        }
        .spworks-cta {
          display: inline-flex; align-items: center; justify-content: center;
          border: 1px solid var(--c-surface, #fff); border-radius: 999px;
          padding: 14px 28px; font-size: 14px; font-weight: 600;
          letter-spacing: 0.02em; color: var(--c-surface, #fff); text-decoration: none;
          margin-top: 28px; transition: background .25s, color .25s;
          font-family: var(--font-body);
        }
        .spworks-cta:hover { background: var(--c-surface, #fff); color: var(--c-ink, #000); }
        .spworks-grid {
          margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 0 40px;
        }
        .spworks-card { cursor: pointer; }
        .spworks-card-img { overflow: hidden; background: var(--c-card); }
        .spworks-card-img img {
          width: 100%; height: 100%; object-fit: cover;
          filter: grayscale(0.1);
          transition: transform 0.8s cubic-bezier(.2,.7,.2,1), filter .6s;
        }
        .spworks-card:hover .spworks-card-img img {
          transform: scale(1.04); filter: grayscale(0);
        }
        .spworks-caption {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 12px; font-size: 14px; font-family: var(--font-body);
        }
        .spworks-caption-title { font-weight: 500; color: var(--c-surface, #fff); }
        .spworks-caption-idx { color: rgba(153,153,153,0.8); }
        @media (max-width: 768px) {
          .spworks { padding: 64px 24px 0; }
          .spworks-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <div style={{ maxWidth: 420, marginTop: 80 }}>
        {intro && <p className="spworks-intro">{intro}</p>}
        <a href="#contact" className="spworks-cta">{cta}</a>
      </div>
      <div className="spworks-grid">
        {items.map((item, i) => (
          <figure key={i} className={`spworks-card ${offsets[i] ?? ""}`} data-spw-parallax>
            <div className={`spworks-card-img ${aspects[i] ?? "aspect-[4/3]"}`}>
              {item.image && (
                <img
                  src={templateBase ? `${templateBase}/${item.image}` : item.image}
                  alt={item.title ?? ""}
                  loading="lazy"
                />
              )}
            </div>
            <figcaption className="spworks-caption">
              <span className="spworks-caption-title">{item.title ?? ""}</span>
              <span className="spworks-caption-idx">{item.index ?? ""}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
