// components/foundry/library/agency-a.tsx
// Composants du LOT « agency-a » : sections signature du template
// creative-agency (bold-type-hero, sticky-stack-projects, outline-services-list,
// letter-tile-cta), aux conventions de la fonderie.
import type { ComponentType } from "react";
import type { Skin } from "@/lib/foundry/types";
import BoldTypeHero from "../components/BoldTypeHero";
import StickyStackProjects from "../components/StickyStackProjects";
import OutlineServicesList from "../components/OutlineServicesList";
import LetterTileCta from "../components/LetterTileCta";

type C = ComponentType<{ content: any; skin: Skin }>;

export const COMPONENTS_AGENCY_A: Record<string, C> = {
  "bold-type-hero": BoldTypeHero as C,
  "sticky-stack-projects": StickyStackProjects as C,
  "outline-services-list": OutlineServicesList as C,
  "letter-tile-cta": LetterTileCta as C,
};
