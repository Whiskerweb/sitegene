"use client";
// components/foundry/fx.tsx — micro-effets PARTAGÉS des sections foundry.
// Transform/opacity uniquement (compositeur GPU, pas de reflow), tout est
// piloté par IntersectionObserver/rAF : aucun coût quand rien ne bouge.
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

/** Entrée en scène au scroll : translation + fondu, une seule fois. */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
  style,
}: {
  children: ReactNode;
  /** Décalage (ms) — pour les entrées en cascade. */
  delay?: number;
  /** Amplitude de la translation initiale (px). */
  y?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: on ? 1 : 0,
        transform: on ? "none" : `translateY(${y}px)`,
        transition: `opacity .7s ease ${delay}ms, transform .7s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Parallaxe verticale : renvoie la ref du conteneur et le style à poser sur
 * l'élément interne (image surdimensionnée qui glisse pendant le défilement).
 */
export function useParallax(strength = 60) {
  const ref = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // Progression -0.5 → 0.5 pendant que la section traverse l'écran.
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height))) - 0.5;
      setShift(p * strength * 2);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    // capture:true : attrape aussi le scroll des conteneurs internes
    // (canvas de L'Atelier) — pas seulement celui de la fenêtre.
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength]);
  const style: CSSProperties = { transform: `translateY(${shift}px)`, willChange: "transform" };
  return { ref, style };
}
