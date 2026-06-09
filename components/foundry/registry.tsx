// components/foundry/registry.tsx
import type { ComponentType } from "react";
import type { Skin } from "@/lib/foundry/types";
import { MANIFESTS } from "@/lib/foundry/manifests";
import HeroSplitAsym from "./components/HeroSplitAsym";
import ServicesRows from "./components/ServicesRows";
import TestimonialsCarousel from "./components/TestimonialsCarousel";
import ReviewsPostitCarousel from "./components/ReviewsPostitCarousel";
import FaqAccordion from "./components/FaqAccordion";
import CtaBanner from "./components/CtaBanner";
import LogoMarquee from "./components/LogoMarquee";
import PricingCards from "./components/PricingCards";
import StatsCountup from "./components/StatsCountup";
import FooterColumns from "./components/FooterColumns";

type FoundryComponent = ComponentType<{ content: any; skin: Skin }>;

export const COMPONENTS: Record<string, FoundryComponent> = {
  "hero-split-asym": HeroSplitAsym as FoundryComponent,
  "services-rows": ServicesRows as FoundryComponent,
  "testimonials-carousel": TestimonialsCarousel as FoundryComponent,
  "reviews-postit-carousel": ReviewsPostitCarousel as FoundryComponent,
  "faq-accordion": FaqAccordion as FoundryComponent,
  "cta-banner": CtaBanner as FoundryComponent,
  "logo-marquee": LogoMarquee as FoundryComponent,
  "pricing-cards": PricingCards as FoundryComponent,
  "stats-countup": StatsCountup as FoundryComponent,
  "footer-columns": FooterColumns as FoundryComponent,
};

// Garde de parité (dev) : tout manifest a un composant et inversement.
if (process.env.NODE_ENV !== "production") {
  const mk = Object.keys(MANIFESTS).sort().join(",");
  const ck = Object.keys(COMPONENTS).sort().join(",");
  if (mk !== ck) console.warn(`[foundry] parité manifest/composant rompue : manifests=[${mk}] composants=[${ck}]`);
}
