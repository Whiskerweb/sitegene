// components/foundry/library/artisans-a.tsx
// Composants du LOT PILOTE artisans-a (Plumber Pro, Plumber Modern, Plumber Emergency).
import type { ComponentType } from "react";
import type { Skin } from "@/lib/foundry/types";
import PlumberProNavbar from "../components/PlumberProNavbar";
import PlumberProHero from "../components/PlumberProHero";
import PlumberProIntro from "../components/PlumberProIntro";
import PlumberProServices from "../components/PlumberProServices";
import PlumberProProcess from "../components/PlumberProProcess";
import PlumberProStats from "../components/PlumberProStats";
import PlumberProTestimonials from "../components/PlumberProTestimonials";
import PlumberProFaq from "../components/PlumberProFaq";
import PlumberProCta from "../components/PlumberProCta";
import PlumberProFooter from "../components/PlumberProFooter";
import PlumberModernNavbar from "../components/PlumberModernNavbar";
import PlumberModernHero from "../components/PlumberModernHero";
import PlumberEmergencyNavbar from "../components/PlumberEmergencyNavbar";
import PlumberEmergencyHero from "../components/PlumberEmergencyHero";

type C = ComponentType<{ content: any; skin: Skin }>;

export const COMPONENTS_ARTISANS_A: Record<string, C> = {
  "plumber-pro-navbar": PlumberProNavbar as C,
  "plumber-pro-hero": PlumberProHero as C,
  "plumber-pro-intro": PlumberProIntro as C,
  "plumber-pro-services": PlumberProServices as C,
  "plumber-pro-process": PlumberProProcess as C,
  "plumber-pro-stats": PlumberProStats as C,
  "plumber-pro-testimonials": PlumberProTestimonials as C,
  "plumber-pro-faq": PlumberProFaq as C,
  "plumber-pro-cta": PlumberProCta as C,
  "plumber-pro-footer": PlumberProFooter as C,
  "plumber-modern-navbar": PlumberModernNavbar as C,
  "plumber-modern-hero": PlumberModernHero as C,
  "plumber-emergency-navbar": PlumberEmergencyNavbar as C,
  "plumber-emergency-hero": PlumberEmergencyHero as C,
};
