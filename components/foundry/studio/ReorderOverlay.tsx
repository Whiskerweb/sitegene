"use client";
// components/foundry/studio/ReorderOverlay.tsx
// Mode « réorganiser » : un clic sur la poignée dézoome la page en cartes
// compactes ; la section saisie est EN MAIN (fantôme qui suit le curseur) et on
// la glisse entre les autres — une ligne d'insertion montre où elle se posera.
// Pointer events (robuste, tactile compris), pas de drag HTML5.
import { useEffect, useRef, useState } from "react";
import { Check, GripVertical } from "lucide-react";
import { Preview } from "./panels";
import type { StudioSection, StudioVibe } from "./types";

export default function ReorderOverlay({
  sections,
  vibe,
  brandPrimary,
  brandLogo,
  brandLogoScale,
  initialHeld,
  onMove,
  onClose,
}: {
  sections: StudioSection[];
  vibe: StudioVibe;
  brandPrimary: string | null;
  brandLogo?: string | null;
  brandLogoScale?: number | null;
  /** Section saisie au démarrage (celle dont on a cliqué la poignée). */
  initialHeld: number;
  /** Déplace from → to (persisté par le parent). */
  onMove: (from: number, to: number) => void;
  onClose: () => void;
}) {
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [held, setHeld] = useState<number | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  // Position d'insertion = index AVANT lequel la section se posera (0..n).
  const [insertAt, setInsertAt] = useState<number | null>(null);

  // Animation d'entrée : on saisit d'emblée la section cliquée.
  useEffect(() => {
    const t = setTimeout(() => setHeld(initialHeld), 60);
    return () => clearTimeout(t);
  }, [initialHeld]);

  // Calcule l'index d'insertion d'après la position verticale du curseur.
  function computeInsert(clientY: number): number {
    let idx = sections.length;
    for (let i = 0; i < sections.length; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (clientY < r.top + r.height / 2) { idx = i; break; }
    }
    return idx;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (held === null) return;
    setGhost({ x: e.clientX, y: e.clientY });
    setInsertAt(computeInsert(e.clientY));
  }

  function drop() {
    if (held !== null && insertAt !== null) {
      // insertAt est un index AVANT déplacement ; on convertit en cible finale.
      let to = insertAt;
      if (insertAt > held) to = insertAt - 1;
      if (to !== held && to >= 0 && to < sections.length) onMove(held, to);
    }
    setHeld(null);
    setGhost(null);
    setInsertAt(null);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-neutral-200/95 backdrop-blur-sm" onPointerMove={onPointerMove} onPointerUp={drop}>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-300 bg-white/80 px-5">
        <div className="leading-tight">
          <p className="text-[14px] font-bold text-neutral-900">Réorganiser vos sections</p>
          <p className="text-[11.5px] text-neutral-500">{held !== null ? "Glissez la section et relâchez à l'endroit voulu." : "Saisissez une section pour la déplacer."}</p>
        </div>
        <button onClick={onClose} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-neutral-900 px-4 text-[13px] font-semibold text-white hover:bg-neutral-700"><Check size={15} /> Terminé</button>
      </header>

      <div className="flex-1 select-none overflow-y-auto py-8" style={{ touchAction: "none" }}>
        <div className="mx-auto flex max-w-md flex-col px-4">
          {sections.map((s, i) => {
            const isHeld = held === i;
            return (
              <div key={`${s.component}-${i}`}>
                {/* Ligne d'insertion au-dessus de cette carte */}
                <Insertion show={held !== null && insertAt === i && !isHeld} />
                <div
                  ref={(el) => { cardRefs.current[i] = el; }}
                  onPointerDown={(e) => { e.preventDefault(); setHeld(i); setGhost({ x: e.clientX, y: e.clientY }); setInsertAt(i); }}
                  className={`flex cursor-grab items-center gap-3 rounded-2xl border bg-white p-2.5 transition active:cursor-grabbing ${
                    isHeld ? "border-dashed border-neutral-300 opacity-35" : "border-neutral-200 shadow-sm hover:border-neutral-400"
                  }`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-neutral-400"><GripVertical size={16} /></span>
                  <div className="pointer-events-none overflow-hidden rounded-lg border border-neutral-100">
                    <Preview id={s.component} content={s.content} vibe={vibe} brandPrimary={brandPrimary} brandLogo={brandLogo} brandLogoScale={brandLogoScale} width={300} height={92} />
                  </div>
                  <span className="text-[13px] font-semibold text-neutral-700">{s.roleLabel}</span>
                </div>
              </div>
            );
          })}
          {/* Insertion en toute fin */}
          <Insertion show={held !== null && insertAt === sections.length && held !== sections.length - 1} />
        </div>
      </div>

      {/* Fantôme « en main » */}
      {held !== null && ghost && (
        <div className="pointer-events-none fixed z-[95] -translate-x-1/2 -translate-y-1/2 rotate-[-2deg]" style={{ left: ghost.x, top: ghost.y }}>
          <div className="flex items-center gap-2 rounded-2xl border border-neutral-300 bg-white p-2 shadow-2xl">
            <div className="overflow-hidden rounded-lg border border-neutral-100">
              <Preview id={sections[held].component} content={sections[held].content} vibe={vibe} brandPrimary={brandPrimary} brandLogo={brandLogo} brandLogoScale={brandLogoScale} width={260} height={80} />
            </div>
            <span className="pr-1 text-[12.5px] font-bold text-neutral-800">{sections[held].roleLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Insertion({ show }: { show: boolean }) {
  return (
    <div className="flex items-center" style={{ height: show ? 28 : 10, transition: "height .12s" }}>
      {show && (
        <div className="flex w-full items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--c-accent, #7c3aed)" }} />
          <span className="h-[3px] flex-1 rounded-full" style={{ background: "var(--c-accent, #7c3aed)" }} />
        </div>
      )}
    </div>
  );
}
