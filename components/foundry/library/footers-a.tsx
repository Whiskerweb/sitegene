// components/foundry/library/footers-a.tsx
// Composants du LOT « footers-a » : pieds de page importés (taped-card, giant-brand,
// cinematic), adaptés aux conventions de la fonderie.
import type { ComponentType } from "react";
import type { Skin } from "@/lib/foundry/types";
import FooterTapedCard from "../components/FooterTapedCard";
import FooterGiantBrand from "../components/FooterGiantBrand";
import FooterCinematic from "../components/FooterCinematic";

type C = ComponentType<{ content: any; skin: Skin }>;

export const COMPONENTS_FOOTERS_A: Record<string, C> = {
  "footer-taped-card": FooterTapedCard as C,
  "footer-giant-brand": FooterGiantBrand as C,
  "footer-cinematic": FooterCinematic as C,
};
