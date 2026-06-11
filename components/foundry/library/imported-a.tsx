// components/foundry/library/imported-a.tsx
// Composants du LOT « imported-a » (briefs externes adaptés à la fonderie).
import type { ComponentType } from "react";
import type { Skin } from "@/lib/foundry/types";
import MarqueeHero from "../components/MarqueeHero";
import GooeyPixelTrail from "../components/GooeyPixelTrail";
import BoldStackHero from "../components/BoldStackHero";

type C = ComponentType<{ content: any; skin: Skin }>;

export const COMPONENTS_IMPORTED_A: Record<string, C> = {
  "bold-stack-hero": BoldStackHero as C,
  "marquee-hero": MarqueeHero as C,
  "fx-gooey-pixel-trail": GooeyPixelTrail as C,
  // Même composant, exposé aussi en section milieu de page (rôle media).
  "fx-gooey-banner": GooeyPixelTrail as C,
};
