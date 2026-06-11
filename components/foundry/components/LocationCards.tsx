"use client";
// components/foundry/components/LocationCards.tsx
// Import adapté (style « card-17 / location-card ») : cartes de LIEUX avec
// inclinaison 3D au survol (la souris fait pivoter la carte) + bouton itinéraire.
// Réécrit SANS framer-motion : suivi souris + transform inline. CSS vars.
// Idéal pour une section « où nous trouver » (rôle contact). Modulable.
import { useState } from "react";
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";
import { Eyebrow } from "../primitives";

interface Place { city: string; address: string; image: string; directionsUrl?: string }

function TiltCard({ place }: { place: Place }) {
  const [t, setT] = useState({ rx: 0, ry: 0, on: false });
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - r.left) / r.width - 0.5;
    const yPct = (e.clientY - r.top) / r.height - 0.5;
    setT({ rx: -yPct * 8, ry: xPct * 8, on: true });
  };
  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={() => setT({ rx: 0, ry: 0, on: false })}
      className="group relative h-72 w-full overflow-hidden rounded-[var(--r-card)] bg-cover bg-center shadow-lg transition-shadow duration-300 hover:shadow-2xl"
      style={{ backgroundImage: `url(${place.image})`, transform: `rotateX(${t.rx}deg) rotateY(${t.ry}deg)`, transition: t.on ? "transform .1s" : "transform .5s ease" }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      <div className="absolute inset-0 flex items-end justify-between gap-3 p-5 text-white">
        <div className="min-w-0">
          <h3 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>{place.city}</h3>
          <p className="mt-0.5 text-sm text-white/80">{place.address}</p>
        </div>
        <a
          href={place.directionsUrl || "#"} target="_blank" rel="noopener noreferrer"
          className="shrink-0 rounded-[var(--r-pill)] px-4 py-2 text-sm font-semibold transition hover:brightness-95"
          style={{ background: "var(--c-surface)", color: "var(--c-ink)" }}
        >
          Itinéraire
        </a>
      </div>
    </div>
  );
}

export default function LocationCards({ content }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  const places: Place[] = Array.isArray(content?.items) ? content.items : [];
  return (
    <section className="px-5 py-16 md:py-24" style={{ ...root, background: "var(--c-surface)" }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          {content?.eyebrow && <Eyebrow>{content.eyebrow}</Eyebrow>}
          {content?.title && <h2 className="mt-3 text-[2rem] font-bold md:text-[2.8rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1px", lineHeight: 1.1 }}>{content.title}</h2>}
          {content?.subtitle && <p className="mt-3 max-w-xl text-lg" style={{ color: "var(--c-muted)" }}>{content.subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2" style={{ perspective: 1000 }}>
          {places.map((p, i) => (<TiltCard key={i} place={p} />))}
        </div>
      </div>
    </section>
  );
}
