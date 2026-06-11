"use client";
// components/foundry/SmartNav.tsx
// En-tête « comme un vrai site » : la navbar part en haut du document et
// DÉFILE naturellement avec la page (jamais collée en permanence). Dès que le
// visiteur REMONTE, elle revient se poser en haut de l'écran (ombre portée) ;
// il descend à nouveau → elle s'efface. Appliqué par l'Assembler à toute
// section de rôle « navbar », quel que soit le composant.
import { useEffect, useRef, useState } from "react";

type Mode = "top" | "hidden" | "revealed";

/** Seuil sous lequel on considère être « en haut de page » (navbar en flux). */
const TOP_OFFSET = 90;
/** Mouvement minimal (px) avant de changer d'état — évite le scintillement. */
const WIGGLE = 6;

export default function SmartNav({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("top");
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY.current;
      if (Math.abs(dy) < WIGGLE) return;
      lastY.current = y;
      if (y <= TOP_OFFSET) setMode("top");
      else if (dy > 0) setMode("hidden");
      else setMode("revealed");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        transform: mode === "hidden" ? "translateY(-103%)" : "translateY(0)",
        transition: "transform .32s ease, box-shadow .32s ease",
        boxShadow: mode === "revealed" ? "0 10px 34px rgba(0,0,0,.14)" : "none",
      }}
    >
      {children}
    </div>
  );
}
