"use client";
// components/foundry/components/OutlineServicesList.tsx
// (Agency) SERVICES EN TYPO CONTOUR : liste de noms en capitales géantes
// évidées (text-stroke) — l'item actif (survol / focus / tap) se remplit en
// couleur pleine ; à droite, un panneau sticky montre l'image du service actif
// (crossfade CSS) + sa liste « ce qui est inclus » à coches accent. Fond encre,
// interaction useState, vars sémantiques. Modulable 2 à N services.
import { useState } from "react";
import type { Skin } from "@/lib/foundry/types";

interface ServiceItem {
  n?: string;
  name: string;
  image?: string;
  includedLabel?: string;
  included?: string[];
}

export default function OutlineServicesList({ content, skin }: { content: any; skin: Skin }) {
  const items: ServiceItem[] = Array.isArray(content?.items) ? content.items : [];
  const [active, setActive] = useState(0);
  const current = items[Math.min(active, Math.max(0, items.length - 1))];

  return (
    <section
      className="osvc"
      style={{ "--c-accent": skin?.accent } as React.CSSProperties}
    >
      <style>{`
        .osvc {
          background: var(--c-panel); color: var(--c-on-panel);
          padding: 80px 24px;
        }
        .osvc-in {
          max-width: 1240px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr; gap: 40px;
        }
        @media (min-width: 1024px) { .osvc-in { grid-template-columns: 2fr 1fr; } }
        .osvc-item {
          display: flex; align-items: baseline; gap: 16px;
          width: 100%; padding: 8px 0; text-align: left;
          background: none; border: 0; cursor: pointer; color: inherit;
        }
        .osvc-n {
          font-family: var(--font-label, var(--font-body)); font-size: 11px;
          letter-spacing: .14em;
          color: color-mix(in srgb, var(--c-on-panel) 38%, transparent);
        }
        .osvc-name {
          font-family: var(--font-heading); text-transform: uppercase;
          font-size: clamp(34px, 5.2vw, 72px); line-height: .95; letter-spacing: .01em;
          color: transparent;
          -webkit-text-stroke: 1px color-mix(in srgb, var(--c-on-panel) 30%, transparent);
          transition: color .3s ease;
        }
        .osvc-item[data-active="true"] .osvc-name {
          color: var(--c-on-panel);
          -webkit-text-stroke: 1px transparent;
        }
        .osvc-panel { position: sticky; top: 96px; align-self: start; }
        .osvc-img {
          position: relative; aspect-ratio: 4/3; overflow: hidden;
          background: color-mix(in srgb, var(--c-on-panel) 6%, var(--c-panel));
        }
        .osvc-img img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; opacity: 0;
          animation: osvc-in .45s ease forwards;
        }
        @keyframes osvc-in { from { opacity: 0; transform: scale(1.06); } to { opacity: 1; transform: scale(1); } }
        .osvc-label {
          margin: 22px 0 12px;
          font-family: var(--font-label, var(--font-body)); font-size: 11px;
          letter-spacing: .14em; text-transform: uppercase;
          color: color-mix(in srgb, var(--c-on-panel) 80%, transparent);
        }
        .osvc-line {
          display: flex; align-items: flex-start; gap: 10px;
          margin: 0 0 10px; font-family: var(--font-body); font-size: 13.5px;
          line-height: 1.5; color: color-mix(in srgb, var(--c-on-panel) 62%, transparent);
        }
        .osvc-check { width: 13px; height: 13px; flex-shrink: 0; margin-top: 3px; fill: none; stroke: var(--c-accent); stroke-width: 3; }
      `}</style>
      <div className="osvc-in">
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {items.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                className="osvc-item"
                data-active={active === i}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
              >
                {s.n && <span className="osvc-n">{s.n}</span>}
                <span className="osvc-name">{s.name}</span>
              </button>
            </li>
          ))}
        </ul>

        {current && (
          <div className="osvc-panel">
            {current.image && (
              <div className="osvc-img">
                <img key={current.image} src={current.image} alt={current.name} loading="lazy" />
              </div>
            )}
            {Array.isArray(current.included) && current.included.length > 0 && (
              <>
                <p className="osvc-label">{current.includedLabel || "Ce qui est inclus"}</p>
                {current.included.map((line, j) => (
                  <p key={j} className="osvc-line">
                    <svg className="osvc-check" viewBox="0 0 24 24" aria-hidden>
                      <path d="M4 12.5l5 5L20 6.5" />
                    </svg>
                    {line}
                  </p>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
