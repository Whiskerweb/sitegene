// components/foundry/library/sections-a.tsx
// Composants du LOT « sections-a » : sections importées (team-showcase, blog-cards,
// social-clip-links, expand-gallery), adaptées aux conventions de la fonderie.
import type { ComponentType } from "react";
import type { Skin } from "@/lib/foundry/types";
import TeamShowcase from "../components/TeamShowcase";
import BlogCards from "../components/BlogCards";
import SocialClipLinks from "../components/SocialClipLinks";
import ExpandGallery from "../components/ExpandGallery";

type C = ComponentType<{ content: any; skin: Skin }>;

export const COMPONENTS_SECTIONS_A: Record<string, C> = {
  "team-showcase": TeamShowcase as C,
  "blog-cards": BlogCards as C,
  "social-clip-links": SocialClipLinks as C,
  "expand-gallery": ExpandGallery as C,
};
