// components/foundry/registry.tsx
import type { ComponentType } from "react";
import type { Skin } from "@/lib/foundry/types";
import { MANIFESTS } from "@/lib/foundry/manifests";
import { LIBRARY_COMPONENTS } from "./library";
import HeroSplitAsym from "./components/HeroSplitAsym";
import ServicesRows from "./components/ServicesRows";
import TestimonialsCarousel from "./components/TestimonialsCarousel";
import ReviewsPostitCarousel from "./components/ReviewsPostitCarousel";
import FaqAccordion from "./components/FaqAccordion";
import CtaBanner from "./components/CtaBanner";
import LogoMarquee from "./components/LogoMarquee";
import PricingCards from "./components/PricingCards";
import StatsCountup from "./components/StatsCountup";
import IntroSplit from "./components/IntroSplit";
import ProcessSteps from "./components/ProcessSteps";
import ContactBlock from "./components/ContactBlock";
import FooterColumns from "./components/FooterColumns";
import ParallaxStrip from "./components/ParallaxStrip";
import GalleryMosaic from "./components/GalleryMosaic";
import TeamCards from "./components/TeamCards";
import StoryTimeline from "./components/StoryTimeline";
import QuoteSpotlight from "./components/QuoteSpotlight";
import MarqueeWords from "./components/MarqueeWords";
import FxCircularReviews from "./components/FxCircularReviews";
import FxContainerScroll from "./components/FxContainerScroll";
import FxDisplayCards from "./components/FxDisplayCards";
import FxStaggerReviews from "./components/FxStaggerReviews";
import FxShuffleReviews from "./components/FxShuffleReviews";
import FxFloatingTags from "./components/FxFloatingTags";

type FoundryComponent = ComponentType<{ content: any; skin: Skin }>;

/** Socle historique (extraction Sereenity). */
const CORE_COMPONENTS: Record<string, FoundryComponent> = {
  "hero-split-asym": HeroSplitAsym as FoundryComponent,
  "services-rows": ServicesRows as FoundryComponent,
  "testimonials-carousel": TestimonialsCarousel as FoundryComponent,
  "reviews-postit-carousel": ReviewsPostitCarousel as FoundryComponent,
  "faq-accordion": FaqAccordion as FoundryComponent,
  "cta-banner": CtaBanner as FoundryComponent,
  "logo-marquee": LogoMarquee as FoundryComponent,
  "pricing-cards": PricingCards as FoundryComponent,
  "stats-countup": StatsCountup as FoundryComponent,
  "intro-split": IntroSplit as FoundryComponent,
  "process-steps": ProcessSteps as FoundryComponent,
  "contact-block": ContactBlock as FoundryComponent,
  "footer-columns": FooterColumns as FoundryComponent,
  "parallax-strip": ParallaxStrip as FoundryComponent,
  "gallery-mosaic": GalleryMosaic as FoundryComponent,
  "team-cards": TeamCards as FoundryComponent,
  "story-timeline": StoryTimeline as FoundryComponent,
  "quote-spotlight": QuoteSpotlight as FoundryComponent,
  "marquee-words": MarqueeWords as FoundryComponent,
  "fx-circular-reviews": FxCircularReviews as FoundryComponent,
  "fx-container-scroll": FxContainerScroll as FoundryComponent,
  "fx-display-cards": FxDisplayCards as FoundryComponent,
  "fx-stagger-reviews": FxStaggerReviews as FoundryComponent,
  "fx-shuffle-reviews": FxShuffleReviews as FoundryComponent,
  "fx-floating-tags": FxFloatingTags as FoundryComponent,
};

/** Registre complet : socle + library extraite des sites. */
export const COMPONENTS: Record<string, FoundryComponent> = {
  ...CORE_COMPONENTS,
  ...(LIBRARY_COMPONENTS as Record<string, FoundryComponent>),
};

// Garde de parité (dev) : tout manifest a un composant et inversement.
if (process.env.NODE_ENV !== "production") {
  const mk = Object.keys(MANIFESTS).sort().join(",");
  const ck = Object.keys(COMPONENTS).sort().join(",");
  if (mk !== ck) console.warn(`[foundry] parité manifest/composant rompue : manifests=[${mk}] composants=[${ck}]`);
}
