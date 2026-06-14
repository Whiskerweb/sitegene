// components/foundry/library/sections-b.tsx
// Composants du LOT « sections-b » : galeries, avis, blog et lieux importés,
// adaptés aux conventions de la fonderie.
import type { ComponentType } from "react";
import type { Skin } from "@/lib/foundry/types";
import CarouselCards from "../components/CarouselCards";
import ImageMarquee from "../components/ImageMarquee";
import ScrollVelocityGallery from "../components/ScrollVelocityGallery";
import TestimonialsMarquee from "../components/TestimonialsMarquee";
import LiquidReviewsMarquee from "../components/LiquidReviewsMarquee";
import BlogPosts from "../components/BlogPosts";
import LocationCards from "../components/LocationCards";

type C = ComponentType<{ content: any; skin: Skin }>;

export const COMPONENTS_SECTIONS_B: Record<string, C> = {
  "carousel-cards": CarouselCards as C,
  "image-marquee": ImageMarquee as C,
  "scroll-velocity-gallery": ScrollVelocityGallery as C,
  "testimonials-marquee": TestimonialsMarquee as C,
  "liquid-reviews-marquee": LiquidReviewsMarquee as C,
  "blog-posts": BlogPosts as C,
  "location-cards": LocationCards as C,
};
